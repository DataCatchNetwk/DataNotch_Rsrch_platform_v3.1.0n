import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import net from 'node:net';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
const apiPort = Number(process.env.API_PORT ?? 3001);

const checks = [
  {
    name: 'healthcheck',
    script: 'scripts/healthcheck.mjs',
    env: {
      HEALTHCHECK_MODE: 'cutover',
      API_BASE_URL: apiBaseUrl,
      API_PORT: String(apiPort),
    },
  },
  { name: 'smoke:auth', script: 'scripts/smoke-auth.mjs' },
  {
    name: 'smoke:domain-aliases',
    script: 'scripts/smoke-domain-aliases.mjs',
    env: {
      API_BASE_URL: apiBaseUrl,
    },
  },
];

let managedApiProcess = null;

function runCheck(check) {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(rootDir, check.script);
    const child = spawn(process.execPath, [scriptPath], {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...(check.env ?? {}),
      },
    });

    child.once('close', (code) => {
      resolve(typeof code === 'number' ? code : 1);
    });

    child.once('error', () => {
      resolve(1);
    });
  });
}

function canConnect(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(1000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function isPortOpen(port) {
  if (await canConnect(port, '127.0.0.1')) return true;
  if (await canConnect(port, '::1')) return true;
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureApiRunning() {
  if (await isPortOpen(apiPort)) {
    console.log(`[ok] api already reachable on localhost:${apiPort}`);
    return;
  }

  console.log(`[run] api not reachable on localhost:${apiPort}, starting local API server`);
  managedApiProcess = spawn('pnpm', ['--dir', 'apps/api', 'dev'], {
    cwd: rootDir,
    shell: true,
    env: process.env,
    stdio: 'inherit',
  });

  const timeoutMs = Number(process.env.CUTOVER_API_START_TIMEOUT_MS ?? 45000);
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortOpen(apiPort)) {
      console.log(`[ok] api is reachable on localhost:${apiPort}`);
      return;
    }
    await sleep(1000);
  }

  throw new Error(`API did not become reachable on localhost:${apiPort} within ${timeoutMs}ms`);
}

function stopManagedApi() {
  if (!managedApiProcess) return;
  managedApiProcess.kill();
  managedApiProcess = null;
}

async function run() {
  console.log('Starting cutover verification sequence...');

  await ensureApiRunning();

  try {
    for (const check of checks) {
      console.log(`\n[run] ${check.name}`);
      const code = await runCheck(check);
      if (code !== 0) {
        console.error(`\n[fail] ${check.name} exited with code ${code}`);
        process.exit(code);
      }
      console.log(`[ok] ${check.name}`);
    }

    console.log('\nCutover verification passed (healthcheck + auth + domain aliases).');
  } finally {
    stopManagedApi();
  }
}

await run();
