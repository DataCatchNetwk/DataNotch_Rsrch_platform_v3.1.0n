import { io } from 'socket.io-client';

const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for the communication socket smoke test.`);
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

function createSocket(token) {
  return io(wsUrl, {
    transports: ['websocket'],
    auth: { token },
  });
}

function waitForEvent(socket, event, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);

    function onEvent(payload) {
      clearTimeout(timer);
      socket.off(event, onEvent);
      resolve(payload);
    }

    socket.on(event, onEvent);
  });
}

async function waitForConnect(socket, timeoutMs = 8000) {
  if (socket.connected) return;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket connect timed out')), timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function run() {
  const { token, user } = await login();

  const room = await request('/api/v1/communication/rooms', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: `Socket Smoke ${Date.now()}`,
      type: 'CALL_ROOM',
      visibility: 'ORG',
    }),
  });

  const socketA = createSocket(token);
  const socketB = createSocket(token);

  try {
    await Promise.all([waitForConnect(socketA), waitForConnect(socketB)]);

    socketA.emit('room:join', { roomId: room.id });
    socketB.emit('room:join', { roomId: room.id });

    const messagePromise = waitForEvent(socketB, 'message:new');
    socketA.emit('message:send', { roomId: room.id, body: 'socket smoke message' });
    const messageEvent = await messagePromise;

    if (!messageEvent?.message?.body || messageEvent.message.body !== 'socket smoke message') {
      throw new Error(`Unexpected message event payload: ${JSON.stringify(messageEvent)}`);
    }

    const offerPromise = waitForEvent(socketB, 'call:offer');
    socketA.emit('call:offer', { roomId: room.id, offer: { type: 'offer', sdp: 'smoke-sdp-offer' } });
    const offerEvent = await offerPromise;

    if (offerEvent?.offer?.type !== 'offer') {
      throw new Error(`Unexpected call:offer payload: ${JSON.stringify(offerEvent)}`);
    }

    const answerPromise = waitForEvent(socketA, 'call:answer');
    socketB.emit('call:answer', { roomId: room.id, answer: { type: 'answer', sdp: 'smoke-sdp-answer' } });
    const answerEvent = await answerPromise;

    if (answerEvent?.answer?.type !== 'answer') {
      throw new Error(`Unexpected call:answer payload: ${JSON.stringify(answerEvent)}`);
    }

    const icePromise = waitForEvent(socketA, 'call:ice');
    socketB.emit('call:ice', {
      roomId: room.id,
      candidate: { candidate: 'candidate:1 1 udp 2122260223 127.0.0.1 9999 typ host', sdpMid: '0', sdpMLineIndex: 0 },
    });
    const iceEvent = await icePromise;

    if (!iceEvent?.candidate?.candidate) {
      throw new Error(`Unexpected call:ice payload: ${JSON.stringify(iceEvent)}`);
    }

    console.log(`[ok] communication socket smoke passed for ${user.email} room=${room.id}`);
  } finally {
    socketA.disconnect();
    socketB.disconnect();
  }
}

await run();
