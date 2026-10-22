/**
 * Build script for Firebase Cloud Functions.
 * Copies the compiled NestJS API and Prisma schema into functions/
 * so the Cloud Function can import them.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FUNCTIONS_DIR = path.join(ROOT, 'functions');
const API_DIST = path.join(ROOT, 'apps', 'api', 'dist');
const PRISMA_DIR = path.join(ROOT, 'prisma');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source not found: ${src}`);
    process.exit(1);
  }
  // Remove existing destination
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }
  fs.cpSync(src, dest, { recursive: true });
  console.log(`  Copied ${src} -> ${dest}`);
}

console.log('Building CAR for Firebase deployment...\n');

// Step 1: Build the NestJS API
console.log('[1/4] Building NestJS API...');
execSync('npm run build:api', { cwd: ROOT, stdio: 'inherit' });

// Step 2: Copy API dist to functions/api/dist
console.log('[2/4] Copying API build to functions/...');
copyDir(API_DIST, path.join(FUNCTIONS_DIR, 'api', 'dist'));
copyDir(path.join(ROOT, 'apps', 'api', 'assets'), path.join(FUNCTIONS_DIR, 'api', 'assets'));

// Step 3: Copy Prisma schema to functions/prisma
console.log('[3/4] Copying Prisma schema...');
copyDir(PRISMA_DIR, path.join(FUNCTIONS_DIR, 'prisma'));

// Step 4: Build functions TypeScript
console.log('[4/4] Building Cloud Functions...');
execSync('npx tsc', { cwd: FUNCTIONS_DIR, stdio: 'inherit' });

console.log('\nBuild complete! Ready to deploy.');
console.log('  Frontend: apps/web/out/');
console.log('  API:      functions/api/dist/');
console.log('  Function: functions/lib/index.js');
console.log('\nNext: firebase deploy');
