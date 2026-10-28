import type { WebSocket } from 'ws';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: {
    anchor: number;
    head: number;
  } | null;
  selection?: {
    from: number;
    to: number;
  } | null;
  lastActive: number;
  isTyping?: boolean;
}

export interface ClientConnection {
  id: string;
  ws: WebSocket;
  roomId: string;
  isAlive: boolean;
  presence?: UserPresence;
}

export interface RoomState {
  name: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  clients: Set<ClientConnection>;
  lastModified: number;
  createdAt: number;
}

export interface RedisMessage {
  type: 'crdt-update' | 'presence-update' | 'peer-disconnect';
  serverId: string;
  roomId: string;
  payload: string; // base64 encoded for CRDT update, JSON for presence
  senderId?: string;
}
