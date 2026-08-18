import { createServer, Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "5001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create HTTP Server wrapping Express App
const server = createServer(app);

// Create Realtime WebSocket Server attached to HTTP Server
const wss = new WebSocketServer({ server, path: "/ws" });

// Active Clients Connection Pool
const clients = new Set<WebSocket>();

wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);
  logger.info({ totalConnected: clients.size }, "Realtime WebSocket client connected");

  // Send Welcome Handshake
  ws.send(JSON.stringify({ type: "CONNECTED", timestamp: new Date().toISOString() }));

  ws.on("message", (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      logger.info({ data }, "Received Realtime WS Message");

      // Broadcast Realtime Event to all connected client devices
      const broadcastPayload = JSON.stringify({
        ...data,
        receivedAt: new Date().toISOString(),
      });

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcastPayload);
        }
      }
    } catch (err) {
      logger.error({ err }, "Error processing WebSocket message");
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    logger.info({ totalConnected: clients.size }, "WebSocket client disconnected");
  });

  ws.on("error", (error: Error) => {
    logger.error({ error }, "WebSocket client error");
  });
});

server.listen(port, "0.0.0.0", () => {
  logger.info({ port, wsPath: "/ws" }, "Realtime Server & WebSockets listening on port");
});
