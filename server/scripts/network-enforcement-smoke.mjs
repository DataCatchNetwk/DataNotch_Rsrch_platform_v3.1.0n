const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

const loginPath = process.env.NETWORK_TEST_LOGIN_PATH ?? '/api/v1/auth/login';
const protectedPath = process.env.NETWORK_TEST_PROTECTED_PATH ?? '/api/v1/users/pending';
const publicIp = process.env.NETWORK_TEST_PUBLIC_IP ?? '8.8.8.8';
const privateIp = process.env.NETWORK_TEST_PRIVATE_IP ?? '127.0.0.1';
const timeoutMs = Number(process.env.NETWORK_TEST_TIMEOUT_MS ?? 10000);

const allowedBlockStatuses = [403, 503];

async function requestJson(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);
    return { status: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

function assertStatusIn(status, allowed, label) {
  if (!allowed.includes(status)) {
    throw new Error(`${label} expected status in [${allowed.join(', ')}], got ${status}`);
  }
}

function assertStatusNotIn(status, blocked, label) {
  if (blocked.includes(status)) {
    throw new Error(`${label} should not be blocked with status ${status}`);
  }
}

async function runPublicIpChecks() {
  const publicHeaders = {
    'content-type': 'application/json',
    'x-forwarded-for': publicIp,
  };

  const loginResult = await requestJson(loginPath, {
    method: 'POST',
    headers: publicHeaders,
    body: JSON.stringify({ identifier: 'invalid@example.com', password: 'invalid' }),
  });

  assertStatusIn(loginResult.status, allowedBlockStatuses, 'Public-IP login check');

  const protectedResult = await requestJson(protectedPath, {
    method: 'GET',
    headers: {
      authorization: 'Bearer invalid.token.value',
      'x-forwarded-for': publicIp,
    },
  });

  assertStatusIn(protectedResult.status, allowedBlockStatuses, 'Public-IP protected-route check');

  console.log(`[ok] public forwarded IP blocked: login=${loginResult.status}, protected=${protectedResult.status}`);
}

async function runPrivateIpChecks() {
  const privateHeaders = {
    'content-type': 'application/json',
    'x-forwarded-for': privateIp,
  };

  const loginResult = await requestJson(loginPath, {
    method: 'POST',
    headers: privateHeaders,
    body: JSON.stringify({}),
  });

  // Private/local traffic should bypass network block and continue normal auth flow.
  assertStatusNotIn(loginResult.status, allowedBlockStatuses, 'Private-IP login check');

  const protectedResult = await requestJson(protectedPath, {
    method: 'GET',
    headers: {
      authorization: 'Bearer invalid.token.value',
      'x-forwarded-for': privateIp,
    },
  });

  // Invalid token should fail auth (typically 401), not network block.
  assertStatusNotIn(protectedResult.status, allowedBlockStatuses, 'Private-IP protected-route check');

  console.log(`[ok] private/local IP allowed to auth flow: login=${loginResult.status}, protected=${protectedResult.status}`);
}

async function run() {
  console.log(`Running network enforcement smoke test against ${apiBaseUrl}`);
  console.log(`Using public IP ${publicIp} and private/local IP ${privateIp}`);

  await runPublicIpChecks();
  await runPrivateIpChecks();

  console.log('Network enforcement smoke test passed.');
}

run().catch((error) => {
  console.error('Network enforcement smoke test failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
