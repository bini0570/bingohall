import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log('--- Building Frontend ---');
  execSync('vite build', { stdio: 'inherit' });

  console.log('--- Building Admin ---');
  execSync('npm install', { cwd: '../admin', stdio: 'inherit' });
  execSync('npm run build', { cwd: '../admin', stdio: 'inherit' });

  console.log('--- Copying Admin to Frontend Dist ---');
  fs.cpSync('../admin/dist', './dist/admin', { recursive: true });

  console.log('--- Build Complete ---');
} catch (err) {
  console.error(err);
  process.exit(1);
}
