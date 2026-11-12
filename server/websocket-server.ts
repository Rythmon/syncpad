import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './room-manager';
import { RedisPubSubService } from './redis-pubsub';
import { ClientConnection } from './types';

export class SyncPadWebSocketServer {
  private server: http.Server;
  private wss: WebSocketServer;
  private roomManager: RoomManager;
  private pubsub: RedisPubSubService;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private port: number;

  constructor(roomManager: RoomManager, pubsub: RedisPubSubService, port: number = 1234) {
    this.roomManager = roomManager;
    this.pubsub = pubsub;
    this.port = port;

    this.server = http.createServer((req, res) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/health' || req.url === '/api/stats') {
        const stats = this.roomManager.getStats();
        const redisStatus = this.pubsub.getStatus();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify(
            {
              status: 'healthy',
              service: 'SyncPad WebSocket Gateway',
              uptime: process.uptime(),
              timestamp: Date.now(),
              redis: redisStatus,
              rooms: stats,
            },
            null,
            2
          )
        );
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('SyncPad Real-Time CRDT Collaborative WebSocket Gateway is operational.\n');
    });

    this.wss = new WebSocketServer({ noServer: true });
    this.setupUpgradeHandler();
    this.setupHeartbeat();
  }

  private setupUpgradeHandler() {
    this.server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      
      // Extract room name from path or query string
      let roomId = url.searchParams.get('room');
      if (!roomId) {
        roomId = url.pathname.replace(/^\/+/, '').split('?')[0];
      }
      if (!roomId || roomId === '') {
        roomId = 'default-document';
      }

      this.wss.handleUpgrade(request, socket, head, (ws) => {
        const clientId = `peer_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
        (ws as any).isAlive = true;
        const client: ClientConnection = {
          id: clientId,
          ws,
          roomId,
          isAlive: true,
        };

        // Binary type must be arraybuffer for Yjs protocols
        ws.binaryType = 'arraybuffer';

        // Notify room manager
        this.roomManager.handleConnection(client);

        ws.on('message', (message: ArrayBuffer) => {
          (ws as any).isAlive = true;
          client.isAlive = true;
          this.roomManager.handleMessage(client, new Uint8Array(message));
        });

        ws.on('pong', () => {
          (ws as any).isAlive = true;
          client.isAlive = true;
        });

        ws.on('close', () => {
          this.roomManager.handleDisconnect(client);
        });

        ws.on('error', (err) => {
          console.error(`[WebSocket] Client ${client.id} error:`, err);
          this.roomManager.handleDisconnect(client);
        });
      });
    });
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
          console.log('[WebSocket] Terminating inactive stale socket connection');
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  public listen(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`[WebSocket Server] SyncPad Gateway listening on port ${this.port}`);
        resolve();
      });
    });
  }

  public async close(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          console.log('[WebSocket Server] Server shut down gracefully.');
          resolve();
        });
      });
    });
  }
}
