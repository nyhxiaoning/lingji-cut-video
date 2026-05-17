const { spawn } = require('node:child_process');
const path = require('node:path');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} was terminated by ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

function buildSpawnEnv() {
  const env = { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR || '1' };
  // ELECTRON_RUN_AS_NODE makes Electron behave as plain Node.js,
  // which breaks require('electron') in the main process.
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_NO_ATTACH_CONSOLE;
  return env;
}

async function main() {
  if (process.platform === 'win32') {
    process.env.PYTHONIOENCODING = process.env.PYTHONIOENCODING || 'utf-8';
    process.env.LANG = process.env.LANG || 'zh_CN.UTF-8';
    process.env.LC_ALL = process.env.LC_ALL || 'zh_CN.UTF-8';
    const winEnv = buildSpawnEnv();
    await run('chcp.com', ['65001']);
    await run('cmd.exe', ['/d', '/s', '/c', 'node_modules\\.bin\\electron-vite.cmd dev --watch'], {
      env: winEnv,
    });
    return;
  }

  await run(path.join('node_modules', '.bin', 'electron-vite'), ['dev', '--watch'], {
    env: buildSpawnEnv(),
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
