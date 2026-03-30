import { spawn } from 'node:child_process';
import path from 'node:path';

const commandRunner =
  process.platform === 'win32'
    ? {
        command: process.execPath,
        baseArgs: [path.join(process.env.APPDATA ?? '', 'npm', 'node_modules', 'pnpm', 'bin', 'pnpm.cjs')],
      }
    : {
        command: 'pnpm',
        baseArgs: [],
      };

const commands = [
  { name: 'server', args: ['--dir', 'server', 'dev'] },
  { name: 'web', args: ['--dir', 'my-app', 'dev'] },
];

const children = new Map();
let shuttingDown = false;

function spawnCommand(command) {
  const child = spawn(commandRunner.command, [...commandRunner.baseArgs, ...command.args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });

  children.set(command.name, child);

  child.on('exit', (code, signal) => {
    children.delete(command.name);

    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    for (const sibling of children.values()) {
      sibling.kill('SIGTERM');
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children.values()) {
    child.kill('SIGTERM');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

for (const command of commands) {
  spawnCommand(command);
}