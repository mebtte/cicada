/* eslint-disable no-console */
import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));

const execAsync = promisify(exec);
const pkgs = await readdir(join(CURRENT_DIR, '../pkgs'));

for (const pkg of pkgs) {
  try {
    await execAsync('tsc --noEmit', {
      cwd: join(CURRENT_DIR, '../pkgs', pkg),
    });
  } catch (error) {
    console.log(error.stdout || error.stderr);
    process.exit(1);
  }
}
