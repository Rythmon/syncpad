import { WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { RedisPubSubService } from './redis-pubsub';
import { RoomState, ClientConnection, RedisMessage } from './types';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_AUTH = 2;
const MESSAGE_QUERY_AWARENESS = 3;

function send(ws: WebSocket, message: Uint8Array): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message, (err) => {
      if (err) console.error('[RoomManager] WebSocket send error:', err);
    });
  }
}

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private pubsub: RedisPubSubService;
  private serverId: string;
  private opsCounter: number = 0;

  constructor(pubsub: RedisPubSubService, serverId: string) {
    this.pubsub = pubsub;
    this.serverId = serverId;
  }

  public getOrCreateRoom(roomId: string): RoomState {
    let room = this.rooms.get(roomId);
    if (!room) {
      const doc = new Y.Doc();
      const awareness = new awarenessProtocol.Awareness(doc);
      awareness.setLocalState(null);

      room = {
        name: roomId,
        doc,
        awareness,
        clients: new Set(),
        lastModified: Date.now(),
        createdAt: Date.now(),
      };

      this.setupDocListeners(room);
      this.setupAwarenessListeners(room);
      this.subscribeRedisChannels(room);

      this.rooms.set(roomId, room);
      console.log(`[RoomManager] Initialized collaborative room "${roomId}"`);

      // Seed initial content if document is new
      this.seedInitialContent(doc);
    }
    return room;
  }

  private seedInitialContent(doc: Y.Doc) {
    // Only seed if doc has no fragments yet
    const type = doc.getXmlFragment('default');
    if (type.length === 0) {
      // TipTap starter content will be initialized or synced from client
    }
  }

  private setupDocListeners(room: RoomState) {
    room.doc.on('update', (update: Uint8Array, origin: any) => {
      room.lastModified = Date.now();
      this.opsCounter++;

      // 1. Broadcast to all connected clients in this room (except origin connection)
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const buff = encoding.toUint8Array(encoder);

      for (const client of room.clients) {
        if (client.ws !== origin) {
          send(client.ws, buff);
        }
      }

      // 2. Broadcast to Redis cluster if the update originated locally (not from Redis)
      if (origin !== 'redis') {
        const base64Update = Buffer.from(update).toString('base64');
        const redisMsg: RedisMessage = {
          type: 'crdt-update',
          serverId: this.serverId,
          roomId: room.name,
          payload: base64Update,
        };
        this.pubsub.publish(`syncpad:crdt:${room.name}`, redisMsg);
      }
    });
  }

  private setupAwarenessListeners(room: RoomState) {
    room.awareness.on(
      'update',
      ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: any) => {
        const changedClients = added.concat(updated, removed);
        if (changedClients.length === 0) return;

        // 1. Broadcast awareness to local clients
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(room.awareness, changedClients)
        );
        const buff = encoding.toUint8Array(encoder);

        for (const client of room.clients) {
          if (client.ws !== origin) {
            send(client.ws, buff);
          }
        }

        // 2. Broadcast awareness updates across Redis instances if not from Redis
        if (origin !== 'redis') {
          const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(room.awareness, changedClients);
          const base64Awareness = Buffer.from(awarenessUpdate).toString('base64');
          const redisMsg: RedisMessage = {
            type: 'presence-update',
            serverId: this.serverId,
            roomId: room.name,
            payload: base64Awareness,
          };
          this.pubsub.publish(`syncpad:presence:${room.name}`, redisMsg);
        }
      }
    );
  }

  private subscribeRedisChannels(room: RoomState) {
    // CRDT Document Updates from Redis
    this.pubsub.subscribe(`syncpad:crdt:${room.name}`, (msg: RedisMessage) => {
      if (msg.serverId === this.serverId) return; // Prevent echo

      try {
        const update = new Uint8Array(Buffer.from(msg.payload, 'base64'));
        Y.applyUpdate(room.doc, update, 'redis');
      } catch (err) {
        console.error(`[RoomManager] Error applying Redis CRDT update to room ${room.name}:`, err);
      }
    });

    // Presence / Awareness Updates from Redis
    this.pubsub.subscribe(`syncpad:presence:${room.name}`, (msg: RedisMessage) => {
      if (msg.serverId === this.serverId) return; // Prevent echo

      try {
        const awarenessUpdate = new Uint8Array(Buffer.from(msg.payload, 'base64'));
        awarenessProtocol.applyAwarenessUpdate(room.awareness, awarenessUpdate, 'redis');
      } catch (err) {
        console.error(`[RoomManager] Error applying Redis awareness update to room ${room.name}:`, err);
      }
    });
  }

  public handleConnection(client: ClientConnection) {
    const room = this.getOrCreateRoom(client.roomId);
    room.clients.add(client);
    console.log(`[RoomManager] Client ${client.id} joined room "${client.roomId}" (total: ${room.clients.size})`);

    // Step 1: Send sync step 1 to newly connected client
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, room.doc);
    send(client.ws, encoding.toUint8Array(encoder));

    // Step 2: Send current awareness state
    const awarenessStates = room.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          room.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(client.ws, encoding.toUint8Array(awarenessEncoder));
    }
  }

  public handleMessage(client: ClientConnection, rawMessage: Uint8Array) {
    const room = this.rooms.get(client.roomId);
    if (!room) return;

    try {
      const decoder = decoding.createDecoder(rawMessage);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, room.doc, client.ws);

          // If the sync protocol responded with sync step 2 or update, send back
          if (encoding.length(encoder) > 1) {
            send(client.ws, encoding.toUint8Array(encoder));
          }
          break;
        }

        case MESSAGE_AWARENESS: {
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            client.ws
          );
          break;
        }

        case MESSAGE_QUERY_AWARENESS: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
          encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(
              room.awareness,
              Array.from(room.awareness.getStates().keys())
            )
          );
          send(client.ws, encoding.toUint8Array(encoder));
          break;
        }

        default:
          console.warn(`[RoomManager] Unknown message type: ${messageType}`);
      }
    } catch (err) {
      console.error(`[RoomManager] Error processing message from client ${client.id}:`, err);
    }
  }

  public handleDisconnect(client: ClientConnection) {
    const room = this.rooms.get(client.roomId);
    if (!room) return;

    room.clients.delete(client);
    console.log(`[RoomManager] Client ${client.id} left room "${client.roomId}" (remaining: ${room.clients.size})`);

    // Clean up awareness states for this connection
    // When a connection drops, awareness protocol handles timeout, but we can explicitly remove if needed
    if (room.clients.size === 0) {
      console.log(`[RoomManager] Room "${client.roomId}" is now idle.`);
    }
  }

  public getStats() {
    let totalConnections = 0;
    const roomStats: any[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      totalConnections += room.clients.size;
      const docState = Y.encodeStateAsUpdate(room.doc);
      roomStats.push({
        id: roomId,
        peers: room.clients.size,
        docBytes: docState.byteLength,
        awarenessUsers: room.awareness.getStates().size,
        lastModified: room.lastModified,
      });
    }

    return {
      activeRooms: this.rooms.size,
      totalConnections,
      opsProcessed: this.opsCounter,
      rooms: roomStats,
    };
  }
}
