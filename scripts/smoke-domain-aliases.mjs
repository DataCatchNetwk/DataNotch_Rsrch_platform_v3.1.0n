const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

const credentials = {
  identifier: process.env.ALIAS_SMOKE_IDENTIFIER ?? process.env.ADMIN_IDENTIFIER,
  password: process.env.ALIAS_SMOKE_PASSWORD ?? process.env.ADMIN_PASSWORD,
};

function buildHeaders(token) {
  return token
    ? {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      }
    : {};
}

async function call(path, token) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'GET',
    headers: buildHeaders(token),
  });

  const body = await response.json().catch(() => null);
  return {
    path,
    status: response.status,
    ok: response.ok,
    body,
  };
}

async function loginIfConfigured() {
  if (!credentials.identifier || !credentials.password) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Auth setup failed with HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  if (!body?.token) {
    throw new Error('Auth setup failed: login response missing token');
  }

  return body.token;
}

function assertStatusInRange(name, actual, expected) {
  if (!expected.includes(actual)) {
    throw new Error(`${name} expected status in [${expected.join(', ')}], got ${actual}`);
  }
}

async function checkParity(name, leftPath, rightPath, expectedStatuses, token = null) {
  const left = await call(leftPath, token);
  const right = await call(rightPath, token);

  if (left.status !== right.status) {
    throw new Error(
      `${name} parity failed: ${left.path} => ${left.status}, ${right.path} => ${right.status}`,
    );
  }

  assertStatusInRange(name, left.status, expectedStatuses);

  console.log(`[ok] ${name}: status=${left.status} (${left.path} == ${right.path})`);
}

async function checkSingle(name, path, expectedStatuses, token = null) {
  const result = await call(path, token);
  assertStatusInRange(name, result.status, expectedStatuses);
  console.log(`[ok] ${name}: status=${result.status} (${path})`);
}

async function run() {
  const token = await loginIfConfigured();

  await checkSingle('health', '/health', [200]);

  await checkSingle(
    'internal domain health (data-preparation)',
    '/api/_internal/domains/data-preparation/_health',
    [200],
  );

  await checkSingle(
    'internal domain health (research-studio)',
    '/api/_internal/domains/research-studio/_health',
    [200],
  );

  // These routes are expected to be parity-equal after cutover.
  // Some routes are business-state dependent (e.g. may return 500 if workflow was not initialized).
  await checkParity(
    'data-preparation stages parity',
    '/api/data-preparation/stages/profiling?datasetId=sdoh-demo',
    '/api/v1/data-preparation/stages/profiling?datasetId=sdoh-demo',
    [200, 400, 404, 500],
  );

  await checkParity(
    'research-lifecycle parity',
    '/api/research-lifecycle/datasets/non-existent-id',
    '/api/v1/research-lifecycle/datasets/non-existent-id',
    [404],
  );

  await checkParity(
    'workspaces parity',
    '/api/workspaces/mine',
    '/api/v1/workspaces/mine',
    token ? [200] : [401],
    token,
  );

  await checkParity(
    'database parity',
    '/api/database/connections',
    '/api/v1/database/connections',
    token ? [200] : [401],
    token,
  );

  console.log('Domain alias smoke test passed.');
}

await run();
