const path = require('node:path');
const { spawnSync } = require('node:child_process');
const result = spawnSync(process.execPath,[require.resolve('playwright/cli'),'install','chromium'],{
  stdio:'inherit',windowsHide:true,env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:process.env.PLAYWRIGHT_BROWSERS_PATH || path.resolve(__dirname,'../.cache/playwright-browsers')},
});
process.exit(result.status ?? 1);
