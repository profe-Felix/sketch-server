const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });
console.log("WebSocket server running on port", PORT);

const sessions = {}; // { sessionId: { clients: Set } }

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error("Invalid message:", message);
      return;
    }

    const { type, sessionId, payload } = data;

    if (type === 'join') {
      if (!sessions[sessionId]) sessions[sessionId] = new Set();
      sessions[sessionId].add(ws);
      ws.sessionId = sessionId;
    }

    // Broadcast to everyone else in the session
    if (sessionId && sessions[sessionId]) {
      sessions[sessionId].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type, payload }));
        }
      });
    }
  });

  ws.on('close', function () {
    if (ws.sessionId && sessions[ws.sessionId]) {
      sessions[ws.sessionId].delete(ws);
      if (sessions[ws.sessionId].size === 0) {
        delete sessions[ws.sessionId];
      }
    }
  });
});