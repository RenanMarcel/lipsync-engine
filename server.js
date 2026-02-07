import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required.');
  console.error('Usage: OPENAI_API_KEY=sk-... npm run demo:realtime');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-realtime';

const app = express();

// COOP/COEP headers for SharedArrayBuffer (required by AudioWorklet)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Serve static files from project root
app.use(express.static(__dirname));

const server = createServer(app);

// WebSocket proxy at /ws/realtime
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws/realtime') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (clientWs) => {
  console.log('[proxy] Client connected');

  // Buffer messages from client until upstream is ready
  const pendingMessages = [];
  let upstreamReady = false;

  const upstream = new WebSocket(OPENAI_REALTIME_URL, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
  });

  upstream.on('open', () => {
    console.log('[proxy] Connected to OpenAI');
    upstreamReady = true;
    for (const msg of pendingMessages) {
      upstream.send(msg);
    }
    pendingMessages.length = 0;
  });

  // Client → OpenAI (buffer until upstream is ready)
  clientWs.on('message', (data) => {
    const str = data.toString();
    if (upstreamReady) {
      upstream.send(str);
    } else {
      pendingMessages.push(str);
    }
  });

  // OpenAI → Client
  upstream.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data.toString());
    }
  });

  upstream.on('error', (err) => {
    console.error('[proxy] Upstream error:', err.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1011, 'Upstream error');
    }
  });

  upstream.on('close', (code, reason) => {
    console.log(`[proxy] Upstream closed: ${code}`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(code, reason.toString());
    }
  });

  clientWs.on('close', () => {
    console.log('[proxy] Client disconnected');
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.close();
    }
  });

  clientWs.on('error', (err) => {
    console.error('[proxy] Client error:', err.message);
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n  OpenAI Realtime + LipSync Demo`);
  console.log(`  ─────────────────────────────`);
  console.log(`  Open: http://localhost:${PORT}/demo/realtime.html`);
  console.log(`  Proxy: ws://localhost:${PORT}/ws/realtime → OpenAI\n`);
});
