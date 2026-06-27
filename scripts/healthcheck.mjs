import net from 'node:net';

const checks = [
  {
    name: 'frontend',
    port: 3000,
    url: 'http://localhost:3000',
    validate: async (response) => response.ok,
  },
  {
    name: 'api',
    port: 3001,
    url: 'http://localhost:3001/health',
    validate: async (response) => {
      if (!response.ok) return false;
      const body = await response.json();
      return body?.status === 'ok';
    },
  },
  {
    name: 'postgres',
    port: 5432,
  },
];

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

async function run() {
  let failed = false;

  for (const check of checks) {
    const portOpen = await isPortOpen(check.port);
    if (!portOpen) {
      console.error(`[fail] ${check.name}: localhost:${check.port} is not reachable`);
      failed = true;
      continue;
    }

    if (!check.url) {
      console.log(`[ok] ${check.name}: localhost:${check.port} is accepting connections`);
      continue;
    }

    try {
      const response = await fetch(check.url);
      const valid = await check.validate(response);
      if (!valid) {
        console.error(`[fail] ${check.name}: ${check.url} responded unexpectedly with HTTP ${response.status}`);
        failed = true;
        continue;
      }

      console.log(`[ok] ${check.name}: ${check.url}`);
    } catch (error) {
      console.error(`[fail] ${check.name}: ${error instanceof Error ? error.message : 'request failed'}`);
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log('Workspace healthcheck passed. Queue backend is PostgreSQL local mode.');
}

await run();
