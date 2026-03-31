import { spawn } from 'node:child_process';
import net from 'node:net';
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
  { name: 'server', args: ['--dir', 'server', 'dev'], port: 4000 },
  { name: 'web', args: ['--dir', 'my-app', 'dev'], port: 3000 },
];

const children = new Map();
let shuttingDown = false;

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

function canConnect(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function isPortBlocked(port) {
  if (await canConnect(port, '127.0.0.1')) {
    return true;
  }

  if (await canConnect(port, '::1')) {
    return true;
  }

  return !(await canListen(port));
}

async function preflightPorts() {
  const blocked = [];
  const available = [];

  for (const command of commands) {
    const inUse = await isPortBlocked(command.port);
    if (inUse) {
      blocked.push(command);
    } else {
      available.push(command);
    }
  }

  return { blocked, available };
}

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

const { blocked, available } = await preflightPorts();

if (blocked.length > 0) {
  console.log('Reusing already-running services:');
  for (const command of blocked) {
    console.log(`- ${command.name} on localhost:${command.port}`);
  }
}

if (available.length === 0) {
  console.log('All workspace services are already running.');
  process.exit(0);
}

for (const command of available) {
  spawnCommand(command);
}