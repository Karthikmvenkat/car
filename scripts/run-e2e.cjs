const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const { randomUUID, randomBytes } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabaseUrl, newTestSchema, requireOwnedSchema } = require('./lib/test-database.cjs');
const { seedE2e } = require('./lib/e2e-seed.cjs');
const workspace = path.resolve(__dirname, '..');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function port() {
  const server = net.createServer(); await new Promise((resolve,reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const value = server.address().port; await new Promise(resolve => server.close(resolve)); return value;
}
function childEnv() {
  const env = {};
  for (const name of ['PATH','Path','SystemRoot','WINDIR','COMSPEC','PATHEXT','TEMP','TMP','HOME','USERPROFILE','LOCALAPPDATA','APPDATA','CI']) if (process.env[name] !== undefined) env[name] = process.env[name];
  return env;
}
async function stop(child) {
  if (!child || !child.pid || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  else { try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); } }
  for (let i = 0; i < 40 && child.exitCode === null && child.signalCode === null; i++) await pause(100);
  if (child.exitCode === null && child.signalCode === null) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
    for (let i=0;i<40 && child.exitCode===null && child.signalCode===null;i++)await pause(100);
    if(child.exitCode===null && child.signalCode===null)throw new Error('An owned child did not stop');
  }
}
async function ready(child, url, validate = async () => true, timeout = 180000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (child.startFailed || child.exitCode !== null || child.signalCode !== null) throw new Error('Owned test server exited before readiness');
    try { const response = await fetch(url, { signal: AbortSignal.timeout(2000) }); if (response.ok && await validate(response)) return; } catch {}
    await pause(300);
  }
  throw new Error('Owned test server readiness timed out');
}
async function run() {
  // Explicit fixture URL only: never load dotenv or reuse a developer service.
  const base = requireTestDatabaseUrl(process.env.CAR_TEST_DATABASE_URL);
  const id = randomUUID(); const schema = newTestSchema();
  const scoped = new URL(base); scoped.searchParams.set('schema', schema); base.searchParams.set('schema','public');
  const artifacts = path.join(workspace, '.cache','e2e',id); await fsp.mkdir(artifacts, { recursive: true });
  const publicRoot = path.join(artifacts, 'public-assets');
  const apiPort = await port(); let webPort = await port(); while (webPort === apiPort) webPort = await port();
  const env = { ...childEnv(), NODE_ENV: 'test', DATABASE_URL: scoped.toString(), CAR_TEST_DATABASE_URL: scoped.toString(), CAR_TEST_DATABASE_SCHEMA: schema,
    CAR_E2E_RUN_ID: id, CAR_E2E_ARTIFACT_DIR: artifacts, CAR_E2E_API_URL: `http://127.0.0.1:${apiPort}/api`, CAR_E2E_WEB_URL: `http://127.0.0.1:${webPort}`,
    JWT_SECRET: randomBytes(48).toString('base64url'), ASSET_WORKER_ENABLED: 'false', NEXT_TELEMETRY_DISABLED: '1',
    UPLOAD_DIR: publicRoot, CATALOG_MEDIA_ROOT: path.join(artifacts,'private-media'), FRONTEND_URL: `http://127.0.0.1:${webPort}`,
    PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(workspace,'.cache','playwright-browsers'),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_ID: '', OPENAI_API_KEY: '', SKETCHFAB_TOKEN: '',
  };
  const db = new PrismaClient({ datasources: { db: { url: base.toString() } } });
  const children = []; const logs = []; let created = false;
  const start = (args,cwd,name,extra = {}) => {
    const stream = fs.createWriteStream(path.join(artifacts, name + '.log')); logs.push(stream);
    const child = spawn(process.execPath,args,{ cwd, env: { ...env,...extra }, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore','pipe','pipe'] });
    child.on('error', () => { child.startFailed = true; });
    child.stdout.pipe(stream, { end: false }); child.stderr.pipe(stream, { end: false }); children.push(child); return child;
  };
  let cancelled=false;
  const interrupt = () => { cancelled=true;for (const child of children) void stop(child).catch(()=>{}); process.exitCode = 1; };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    await db.$connect(); await db.$executeRawUnsafe(`CREATE SCHEMA "${requireOwnedSchema(schema)}"`); created = true;
    for (const args of [
      [require.resolve('prisma/build/index.js'),'migrate','deploy','--schema','prisma/schema.prisma'],
      [require.resolve('typescript/bin/tsc'),'--project','apps/api/tsconfig.json','--incremental','false','--outDir',path.join(artifacts,'api-dist')],
    ]) {
      const result = spawnSync(process.execPath,args,{cwd:workspace,env,encoding:'utf8',windowsHide:true});
      if (result.status !== 0) { await fsp.writeFile(path.join(artifacts,'setup-error.log'), (result.stdout || '') + (result.stderr || '')); throw new Error('Isolated migration/API compilation failed; inspect local setup log'); }
    }
    await seedE2e(env, publicRoot);
    if(cancelled)throw new Error('E2E interrupted');
    const api = start([path.join(artifacts,'api-dist','main.js')],path.join(workspace,'apps','api'),'api',{PORT:String(apiPort)});
    await ready(api,env.CAR_E2E_API_URL + '/content/pages/e2e-run-'+id,async response=>(await response.json()).title===id);
    if(cancelled)throw new Error('E2E interrupted');
    // Next dev rewrites tsconfig/next-env automatically. Run an isolated source
    // copy so its generated configuration can never modify the user's checkout.
    const webApp = path.join(artifacts,'web-app');
    await fsp.cp(path.join(workspace,'apps','web'),webApp,{recursive:true,filter:source=>{
      const name=path.basename(source); return !name.startsWith('.env') && !name.startsWith('.next') && !['node_modules','out','tsconfig.tsbuildinfo'].includes(name);
    }});
    const nestedModules=path.join(workspace,'apps','web','node_modules');
    if(fs.existsSync(nestedModules))await fsp.symlink(nestedModules,path.join(webApp,'node_modules'),process.platform==='win32'?'junction':'dir');
    await fsp.appendFile(path.join(webApp,'next.config.js'), '\nconst e2eHeaders = module.exports.headers;\nmodule.exports.headers = async () => [...(e2eHeaders ? await e2eHeaders() : []), {source:"/:path*",headers:[{key:"X-Car-E2E-Run",value:process.env.CAR_E2E_RUN_ID}]}];\n');
    const web = start([require.resolve('next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port',String(webPort)],webApp,'web',{
      NODE_ENV:'development', NEXT_PUBLIC_API_URL:env.CAR_E2E_API_URL, NEXT_PUBLIC_ASSET_BASE_URL:`http://127.0.0.1:${apiPort}`, CARPAL_BUILD_DIR:`.next-e2e-${id}`,
    });
    await ready(web,env.CAR_E2E_WEB_URL,async response=>response.headers.get('x-car-e2e-run')===id);
    if(cancelled)throw new Error('E2E interrupted');
    process.stdout.write(`Isolated E2E services ready. Reports: ${artifacts}\n`);
    const result = await new Promise(resolve => {
      const child = spawn(process.execPath,[require.resolve('@playwright/test/cli'),'test','--config','playwright.config.ts',...process.argv.slice(2)],{cwd:workspace,env,stdio:'inherit',windowsHide:true});
      children.push(child); child.once('error',()=>resolve(1)); child.once('exit',code=>resolve(code ?? 1));
    });
    process.exitCode = result;
    const args=process.argv.slice(2);const scope=args.length?'focused':'full';
    const record=JSON.stringify({id,artifacts,exitCode:result,scope,args});
    await fsp.writeFile(path.join(workspace,'.cache','e2e','latest.json'),record);
    await fsp.writeFile(path.join(workspace,'.cache','e2e',`latest-${scope}.json`),record);
  } finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    let stopFailed=false;
    for (const child of [...children].reverse()) {try{await stop(child);}catch{stopFailed=true;}}
    for (const log of logs) log.end();
    try { if (created) { await db.$executeRawUnsafe(`DROP SCHEMA "${requireOwnedSchema(schema)}" CASCADE`);
      await fsp.writeFile(path.join(artifacts,'lifecycle.json'),JSON.stringify({id,schemaRemoved:true,ownedServicesStopped:!stopFailed}));
      process.stdout.write(stopFailed?'Owned schema removed; an owned service needs cleanup attention.\n':'Owned E2E services stopped and test schema removed.\n');
      if(stopFailed)throw new Error('Owned process cleanup failed');
    } }
    finally { await db.$disconnect(); }
  }
}
run().catch(error => { process.stderr.write(`E2E setup/cleanup failed: ${error.message === 'Owned test server readiness timed out' ? error.message : 'inspect isolated fixture configuration and local logs; no live fallback allowed'}.\n`); process.exitCode = 1; });
