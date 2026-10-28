import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { RedisMessage } from './types';

export class RedisPubSubService {
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private isConnected: boolean = false;
  private usingFallback: boolean = false;
  private fallbackBus: EventEmitter = new EventEmitter();
  private subscriptions: Map<string, (message: RedisMessage) => void> = new Map();
  private redisUrl: string;

  constructor(redisUrl?: string) {
    this.redisUrl = redisUrl || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.initClients();
  }

  private initClients() {
    try {
      this.publisher = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            if (!this.usingFallback) {
              console.log(
                '[Redis Pub/Sub] Redis not reachable on ' +
                  this.redisUrl +
                  '. Falling back to High-Performance In-Memory Cluster Bus.'
              );
              this.usingFallback = true;
            }
            return Math.min(times * 1000, 10000);
          }
          return 1000;
        },
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.subscriber = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) return Math.min(times * 1000, 10000);
          return 1000;
        },
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.publisher.on('connect', () => {
        this.isConnected = true;
        this.usingFallback = false;
        console.log(`[Redis Pub/Sub] Connected publisher to ${this.redisUrl}`);
      });

      this.subscriber.on('connect', () => {
        console.log(`[Redis Pub/Sub] Connected subscriber to ${this.redisUrl}`);
        // Re-subscribe all active rooms on reconnect
        for (const [channel] of this.subscriptions) {
          this.subscriber?.subscribe(channel).catch(() => {});
        }
      });

      this.publisher.on('error', (err) => {
        if (!this.usingFallback) {
          console.warn(`[Redis Pub/Sub] Publisher error: ${err.message}. Using in-memory bus.`);
          this.usingFallback = true;
        }
      });

      this.subscriber.on('error', (err) => {
        if (!this.usingFallback) {
          this.usingFallback = true;
        }
      });

      // Attempt initial connect asynchronously
      Promise.all([this.publisher.connect(), this.subscriber.connect()])
        .then(() => {
          this.isConnected = true;
          this.usingFallback = false;
        })
        .catch(() => {
          this.usingFallback = true;
          console.log('[Redis Pub/Sub] Initial Redis connection deferred. Running with in-memory Pub/Sub fallback.');
        });

      // Handle incoming messages on Redis subscriber
      this.subscriber.on('message', (channel, rawMessage) => {
        try {
          const parsed = JSON.parse(rawMessage) as RedisMessage;
          const handler = this.subscriptions.get(channel);
          if (handler) {
            handler(parsed);
          }
        } catch (e) {
          console.error('[Redis Pub/Sub] Failed to parse Redis message on channel', channel, e);
        }
      });
    } catch (err: any) {
      console.warn(`[Redis Pub/Sub] Redis init exception: ${err?.message}. Operating on in-memory fallback.`);
      this.usingFallback = true;
    }
  }

  public async publish(channel: string, message: RedisMessage): Promise<void> {
    const payloadStr = JSON.stringify(message);

    if (this.isConnected && this.publisher && !this.usingFallback) {
      try {
        await this.publisher.publish(channel, payloadStr);
        return;
      } catch (err: any) {
        console.warn(`[Redis Pub/Sub] Publish failed (${err.message}). Relaying to in-memory fallback.`);
      }
    }

    // In-memory cluster bus delivery
    setImmediate(() => {
      this.fallbackBus.emit(channel, message);
    });
  }

  public async subscribe(channel: string, callback: (message: RedisMessage) => void): Promise<void> {
    this.subscriptions.set(channel, callback);

    // Register with in-memory bus
    this.fallbackBus.on(channel, callback);

    if (this.isConnected && this.subscriber && !this.usingFallback) {
      try {
        await this.subscriber.subscribe(channel);
      } catch (err) {
        // Fallback already registered
      }
    }
  }

  public async unsubscribe(channel: string): Promise<void> {
    const callback = this.subscriptions.get(channel);
    if (callback) {
      this.fallbackBus.off(channel, callback);
    }
    this.subscriptions.delete(channel);

    if (this.isConnected && this.subscriber && !this.usingFallback) {
      try {
        await this.subscriber.unsubscribe(channel);
      } catch (err) {}
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      usingFallback: this.usingFallback,
      url: this.redisUrl,
      activeChannels: this.subscriptions.size,
    };
  }

  public async close(): Promise<void> {
    this.fallbackBus.removeAllListeners();
    this.subscriptions.clear();
    if (this.publisher) {
      try {
        this.publisher.disconnect();
      } catch {}
    }
    if (this.subscriber) {
      try {
        this.subscriber.disconnect();
      } catch {}
    }
  }
}
