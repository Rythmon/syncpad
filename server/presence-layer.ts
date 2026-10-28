import { RedisPubSubService } from './redis-pubsub';
import { UserPresence, RedisMessage } from './types';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

export class PresenceLayer {
  private pubsub: RedisPubSubService;
  private serverId: string;
  private presenceStore: Map<string, Map<string, UserPresence>> = new Map(); // roomId -> (userId -> UserPresence)

  constructor(pubsub: RedisPubSubService, serverId: string) {
    this.pubsub = pubsub;
    this.serverId = serverId;
  }

  /**
   * Broadcast a user's cursor & selection update across local connections and Redis cluster
   */
  public async broadcastPresence(
    roomId: string,
    presence: UserPresence,
    awareness: awarenessProtocol.Awareness,
    clientId: number
  ): Promise<void> {
    // 1. Update in-memory store
    if (!this.presenceStore.has(roomId)) {
      this.presenceStore.set(roomId, new Map());
    }
    const roomUsers = this.presenceStore.get(roomId)!;
    roomUsers.set(presence.id, {
      ...presence,
      lastActive: Date.now(),
    });

    // 2. Set Yjs awareness local state
    awareness.setLocalStateField('user', {
      id: presence.id,
      name: presence.name,
      color: presence.color,
      avatar: presence.avatar,
      cursor: presence.cursor,
      selection: presence.selection,
      isTyping: presence.isTyping,
    });

    // 3. Publish to Redis Pub/Sub channel for other server instances
    const message: RedisMessage = {
      type: 'presence-update',
      serverId: this.serverId,
      roomId,
      senderId: presence.id,
      payload: JSON.stringify(presence),
    };

    await this.pubsub.publish(`syncpad:presence:${roomId}`, message);
  }

  /**
   * Handle incoming presence update from Redis
   */
  public handleRemotePresence(
    roomId: string,
    message: RedisMessage,
    awareness: awarenessProtocol.Awareness
  ): void {
    if (message.serverId === this.serverId) {
      // Avoid echo loop
      return;
    }

    try {
      const presence = JSON.parse(message.payload) as UserPresence;
      if (!this.presenceStore.has(roomId)) {
        this.presenceStore.set(roomId, new Map());
      }
      this.presenceStore.get(roomId)!.set(presence.id, presence);
    } catch (e) {
      console.error('[PresenceLayer] Error parsing remote presence:', e);
    }
  }

  /**
   * Remove inactive users or disconnected peer
   */
  public removeUser(roomId: string, userId: string): void {
    const roomUsers = this.presenceStore.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);
      if (roomUsers.size === 0) {
        this.presenceStore.delete(roomId);
      }
    }

    this.pubsub.publish(`syncpad:presence:${roomId}`, {
      type: 'peer-disconnect',
      serverId: this.serverId,
      roomId,
      senderId: userId,
      payload: JSON.stringify({ userId, timestamp: Date.now() }),
    });
  }

  public getActiveUsers(roomId: string): UserPresence[] {
    const roomUsers = this.presenceStore.get(roomId);
    if (!roomUsers) return [];
    const now = Date.now();
    // Prune entries older than 30 seconds
    const active: UserPresence[] = [];
    for (const [id, user] of roomUsers.entries()) {
      if (now - user.lastActive < 30000) {
        active.push(user);
      } else {
        roomUsers.delete(id);
      }
    }
    return active;
  }
}
