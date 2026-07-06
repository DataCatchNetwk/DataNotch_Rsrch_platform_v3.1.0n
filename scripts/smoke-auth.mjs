const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for the auth smoke test.`);
  }
  return value;
}

const accounts = [
  {
    label: 'admin',
    identifier: requireEnv('ADMIN_IDENTIFIER'),
    password: requireEnv('ADMIN_PASSWORD'),
    expectedAccountStatus: 'ACTIVE',
    acceptableAccountStatuses: ['ACTIVE'],
    expectedRole: 'ADMIN',
  },
  {
    label: 'researcher',
    identifier: requireEnv('RESEARCHER_IDENTIFIER'),
    password: requireEnv('RESEARCHER_PASSWORD'),
    expectedAccountStatus: 'PENDING_APPROVAL',
    acceptableAccountStatuses: ['PENDING_APPROVAL', 'ACTIVE'],
    expectedRole: 'ANALYST',
  },
];

async function login(account) {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: account.identifier, password: account.password }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${account.label} login failed with HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function verifyCurrentUser(token) {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`/api/v1/auth/me failed with HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  return body?.user;
}

async function run() {
  for (const account of accounts) {
    const result = await login(account);
    const user = result?.user;
    const token = result?.token;

    if (!token || !user) {
      throw new Error(`${account.label} login response is missing token or user payload`);
    }

    const acceptableStatuses = account.acceptableAccountStatuses ?? [account.expectedAccountStatus];
    if (!acceptableStatuses.includes(user.accountStatus)) {
      throw new Error(
        `${account.label} expected accountStatus in [${acceptableStatuses.join(', ')}], got ${user.accountStatus}`,
      );
    }

    if (!Array.isArray(user.roles) || !user.roles.includes(account.expectedRole)) {
      throw new Error(`${account.label} expected role ${account.expectedRole}, got ${JSON.stringify(user.roles)}`);
    }

    const currentUser = await verifyCurrentUser(token);
    if (!currentUser || currentUser.email !== user.email) {
      throw new Error(`${account.label} /me verification did not return the logged in user`);
    }

    console.log(
      `[ok] ${account.label}: ${user.email} roles=${user.roles.join(',')} accountStatus=${user.accountStatus}`,
    );
  }

  console.log('Authentication smoke test passed.');
}

await run();
