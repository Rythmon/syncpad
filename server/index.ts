import dotenv from 'dotenv';
dotenv.config();

import { RedisPubSubService } from './redis-pubsub';
import { PresenceLayer } from './presence-layer';
import { RoomManager } from './room-manager';
import { SyncPadWebSocketServer } from './websocket-server';

const PORT = parseInt(process.env.WS_PORT || process.env.PORT || '1234', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const SERVER_ID = `syncpad-node-${Math.random().toString(36).substring(2, 7)}-${process.pid}`;

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║       SYNCPAD REAL-TIME COLLABORATIVE SERVER              ║');
console.log('║       CRDTs (Yjs) • WebSockets • Redis Pub/Sub            ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`[Config] Node ID: ${SERVER_ID}`);
console.log(`[Config] WebSocket Port: ${PORT}`);
console.log(`[Config] Redis Target: ${REDIS_URL}`);

// Initialize Redis Pub/Sub layer
const pubsub = new RedisPubSubService(REDIS_URL);

// Initialize Room Manager
const roomManager = new RoomManager(pubsub, SERVER_ID);

// Initialize Presence Layer
const presenceLayer = new PresenceLayer(pubsub, SERVER_ID);

// Initialize WebSocket Server
const server = new SyncPadWebSocketServer(roomManager, pubsub, PORT);

server
  .listen()
  .then(() => {
    console.log(`⚡ SyncPad Real-Time Gateway live at ws://localhost:${PORT}`);
    console.log(`📊 Health metrics available at http://localhost:${PORT}/health`);
  })
  .catch((err) => {
    console.error('Fatal error starting SyncPad Gateway:', err);
    process.exit(1);
  });

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[Shutdown] Closing server connections and cleaning up...');
  await server.close();
  await pubsub.close();
  console.log('[Shutdown] Completed. Bye!');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
