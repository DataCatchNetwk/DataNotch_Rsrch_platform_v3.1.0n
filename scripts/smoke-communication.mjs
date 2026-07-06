const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for the communication smoke test.`);
  }
  return value;
}

const account = {
  identifier: process.env.COMM_SMOKE_IDENTIFIER ?? requireEnv('ADMIN_IDENTIFIER'),
  password: process.env.COMM_SMOKE_PASSWORD ?? requireEnv('ADMIN_PASSWORD'),
};

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, options);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed with HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function login() {
  const payload = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: account.identifier, password: account.password }),
  });

  if (!payload?.token || !payload?.user?.id) {
    throw new Error('Login response missing token/user payload');
  }

  return payload;
}

function authHeaders(token) {
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

async function run() {
  const { token, user } = await login();

  const room = await request('/api/v1/communication/rooms', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      name: `Smoke Room ${Date.now()}`,
      type: 'CALL_ROOM',
      visibility: 'ORG',
    }),
  });

  if (!room?.id) {
    throw new Error('Communication room creation did not return an id');
  }

  const message = await request(`/api/v1/communication/rooms/${room.id}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ body: 'Smoke message from communication script' }),
  });

  if (!message?.id || message?.roomId !== room.id) {
    throw new Error('Message endpoint returned invalid payload');
  }

  const call = await request(`/api/v1/communication/rooms/${room.id}/call/start`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ mode: 'AUDIO' }),
  });

  if (!call?.id || call?.status !== 'ACTIVE') {
    throw new Error('Call start endpoint returned invalid payload');
  }

  const ended = await request(`/api/v1/communication/call-sessions/${call.id}/end`, {
    method: 'POST',
    headers: authHeaders(token),
  });

  if (ended?.status !== 'ENDED') {
    throw new Error(`Call did not end successfully: ${JSON.stringify(ended)}`);
  }

  const state = await request(`/api/v1/communication/rooms/${room.id}`, {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!Array.isArray(state?.messages) || state.messages.length === 0) {
    throw new Error('Room state missing persisted messages');
  }

  console.log(`[ok] communication smoke passed for ${user.email} room=${room.id}`);
}

await run();
