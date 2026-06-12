/**
 * Tunnel Manager — WebSocket relay antara VPS dan RS lokal.
 *
 * Setiap RS membuka koneksi WebSocket keluar ke VPS.
 * VPS bisa mengirim request proxy ke RS tertentu dan menerima response.
 */

import { WebSocketServer, WebSocket } from "ws";
import http from "http";

interface TunnelClient {
  rsId: string;
  ws: WebSocket;
  connectedAt: Date;
  lastHeartbeat: Date;
  localVersion?: string;
}

const clients = new Map<string, TunnelClient>();

export function initTunnelServer(server: http.Server | https.Server) {
  const wss = new WebSocketServer({ server, path: "/tunnel" });

  wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress || "unknown";
    console.log(`[TUNNEL] New connection from ${ip}`);

    let rsId: string | null = null;
    let heartbeatTimer: NodeJS.Timeout;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case "auth": {
            rsId = msg.rsId;
            const token = msg.token;
            const expectedToken = process.env.TUNNEL_TOKEN;

            if (!expectedToken) {
              console.error("[TUNNEL] TUNNEL_TOKEN not configured! Rejecting connection.");
              ws.send(JSON.stringify({ type: "error", message: "Server configuration error" }));
              ws.close();
              return;
            }

            if (token !== expectedToken) {
              ws.send(JSON.stringify({ type: "error", message: "Invalid tunnel token" }));
              ws.close();
              return;
            }

            clients.set(rsId, {
              rsId,
              ws,
              connectedAt: new Date(),
              lastHeartbeat: new Date(),
              localVersion: msg.version,
            });
            console.log(`[TUNNEL] RS "${rsId}" authenticated`);

            // Kirim konfirmasi
            ws.send(JSON.stringify({ type: "auth_ok", rsId }));

            // Mulai heartbeat checker
            heartbeatTimer = setInterval(() => {
              try {
                ws.ping();
              } catch {
                cleanup();
              }
            }, 30000);
            break;
          }

          case "heartbeat": {
            const client = clients.get(rsId || "");
            if (client) {
              client.lastHeartbeat = new Date();
              client.localVersion = msg.version || client.localVersion;
            }
            break;
          }

          case "proxy_response": {
            // Response dari RS untuk request yang diproxy
            const pending = pendingRequests.get(msg.requestId);
            if (pending) {
              pending.resolve({
                status: msg.status || 200,
                headers: msg.headers || {},
                body: msg.body,
              });
              pendingRequests.delete(msg.requestId);
            }
            break;
          }

          case "sync_ack": {
            // RS sudah menerima dan memproses data sync
            console.log(`[SYNC] RS ${rsId} ack'd sync ${msg.syncId}`);
            break;
          }
        }
      } catch (err) {
        console.error(`[TUNNEL] Invalid message from ${ip}:`, err);
      }
    });

    ws.on("close", () => cleanup());
    ws.on("error", () => cleanup());

    function cleanup() {
      clearInterval(heartbeatTimer);
      if (rsId) {
        clients.delete(rsId);
        console.log(`[TUNNEL] RS "${rsId}" disconnected`);
      }
    }
  });

  console.log(`[TUNNEL] Server ready at /tunnel`);

  // Periodic cleanup stale connections
  setInterval(() => {
    const now = Date.now();
    for (const [id, client] of clients) {
      if (now - client.lastHeartbeat.getTime() > 120000) {
        console.log(`[TUNNEL] RS "${id}" timed out — closing`);
        try { client.ws.close(); } catch {}
        clients.delete(id);
      }
    }
  }, 60000);
}

// Pending proxy requests
const pendingRequests = new Map<string, {
  resolve: (value: any) => void;
  reject: (err: any) => void;
  timeout: NodeJS.Timeout;
}>();

/**
 * Proxy HTTP request ke RS tertentu melalui tunnel WebSocket.
 */
export async function proxyToRs(
  rsId: string,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; headers: any; body: any }> {
  const client = clients.get(rsId);
  if (!client || client.ws.readyState !== WebSocket.OPEN) {
    throw new Error(`RS "${rsId}" is offline`);
  }

  const requestId = `proxy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`RS "${rsId}" timed out after 30s`));
    }, 30000);

    pendingRequests.set(requestId, { resolve, reject, timeout });

    client.ws.send(JSON.stringify({
      type: "proxy_request",
      requestId,
      method,
      path,
      headers,
      body,
    }));
  });
}

/**
 * Kirim notifikasi push ke semua user di RS tertentu via tunnel.
 */
export async function sendNotification(
  rsId: string,
  title: string,
  body: string,
  data?: any
) {
  const client = clients.get(rsId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({
      type: "notification",
      title,
      body,
      data,
    }));
  }
}

/**
 * Kirim data sync ke RS tertentu.
 */
export async function sendSync(
  rsId: string,
  tableName: string,
  action: "insert" | "update" | "delete",
  record: any
) {
  const client = clients.get(rsId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({
      type: "sync",
      tableName,
      action,
      record,
    }));
  }
}

/**
 * Daftar RS yang sedang online.
 */
export function getOnlineRs(): { rsId: string; version?: string; connectedAt: Date; lastHeartbeat: Date }[] {
  return Array.from(clients.values()).map((c) => ({
    rsId: c.rsId,
    version: c.localVersion,
    connectedAt: c.connectedAt,
    lastHeartbeat: c.lastHeartbeat,
  }));
}

export function isRsOnline(rsId: string): boolean {
  return clients.has(rsId);
}
