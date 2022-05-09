/* eslint-disable no-console */
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const APPS = ['desktop', 'desktop_setting', 'pwa', 'server'];

async function start() {
  for (const app of APPS) {
    try {
      await execAsync('tsc --noEmit', {
        cwd: join(__dirname, '../apps', app),
      });
    } catch (error) {
      console.log(error.stdout || error.stderr);
      process.exit(1);
    }
  }
}

start();
