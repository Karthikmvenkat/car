const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const Module = require('node:module');
const source = ts.transpileModule(fs.readFileSync('apps/web/lib/emi.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const compiled = new Module(path.resolve('apps/web/lib/emi.ts'));
compiled.filename=path.resolve('apps/web/lib/emi.ts');
compiled._compile(source,compiled.filename);
const {calculateEmi}=compiled.exports;
assert.equal(calculateEmi(1200000,0,60).monthly,20000);
assert.ok(Math.abs(calculateEmi(800000,9,60).monthly-16606.68)<0.02);
assert.equal(calculateEmi(0,9,60).total,0);
assert.equal(calculateEmi(-1,9,60),null);
assert.equal(calculateEmi(1000,9,0),null);
assert.equal(calculateEmi(1000,9,2.5),null);
assert.equal(calculateEmi(Infinity,9,60),null);
const root=path.resolve('apps/web/app');
const routes=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(item.name==='page.tsx'){const route='/'+path.relative(root,dir).split(path.sep).join('/');routes.push(route.includes('[slug]')?route.replace('[slug]','2024-bmw-m4-competition'):route);}}}
walk(root);
let next=0;
const results=[];
async function worker(){while(next<routes.length){const route=routes[next++];try{const response=await fetch('http://localhost:3002'+route,{signal:AbortSignal.timeout(60000)});const html=await response.text();results.push({route,status:response.status,hasMain:html.includes('main-content')});}catch(e){results.push({route,error:e.message});}}}
(async()=>{await Promise.all([worker(),worker(),worker()]);results.sort((a,b)=>a.route.localeCompare(b.route));fs.writeFileSync('redesign-route-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),emi:'7 checks passed',routes:results},null,2)+'\n');console.log(JSON.stringify({emi:'7 passed',routes:results.length,failed:results.filter(r=>r.status!==200)}));if(results.some(r=>r.status!==200))process.exitCode=1;})();
