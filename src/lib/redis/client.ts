import { Redis } from '@upstash/redis';

// Mock in-memory para desenvolvimento local sem necessidade de credenciais Upstash imediatas
class InMemoryRedisMock {
  private store = new Map<string, { value: any; expiresAt?: number }>();
  private lists = new Map<string, string[]>();

  async get<T = string>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, opts?: { ex?: number }): Promise<'OK'> {
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async setnx(key: string, value: any): Promise<number> {
    const current = await this.get(key);
    if (current !== null) {
      return 0; // Já existe
    }
    this.store.set(key, { value });
    return 1; // Definido com sucesso
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key) || this.lists.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  async eval(script: string, keys: string[], args: any[]): Promise<any> {
    // Implementação atômica do script Lua de trava de estoque
    if (script.includes("redis.call('get', KEYS[1])")) {
      const stockKey = keys[0];
      const reservationKey = keys[1];
      const buyerId = args[0];
      const ttl = Number(args[1]) || 900; // 15 minutos

      const stock = Number((await this.get<number>(stockKey)) ?? 1);
      if (stock > 0) {
        await this.set(stockKey, stock - 1);
        await this.set(reservationKey, buyerId, { ex: ttl });
        return 1; // Reserva garantida
      }
      return 0; // Esgotado
    }
    return 0;
  }

  async lpush(key: string, ...elements: string[]): Promise<number> {
    const list = this.lists.get(key) || [];
    list.unshift(...elements);
    this.lists.set(key, list);
    return list.length;
  }

  async rpop(key: string): Promise<string | null> {
    const list = this.lists.get(key) || [];
    const item = list.pop() || null;
    this.lists.set(key, list);
    return item;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    if (stop === -1) return list.slice(start);
    return list.slice(start, stop + 1);
  }
}

export interface RedisLike {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: any, opts?: { ex?: number }): Promise<any>;
  setnx(key: string, value: any): Promise<number>;
  del(...keys: string[]): Promise<number>;
  eval(script: string, keys: string[], args: any[]): Promise<any>;
  lpush(key: string, ...elements: string[]): Promise<number>;
  rpop(key: string): Promise<string | null>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
}

// Global singleton
declare global {
  var __redisClient: RedisLike | undefined;
}

export function getRedisClient(): RedisLike {
  if (global.__redisClient) {
    return global.__redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && !url.includes('your-redis')) {
    global.__redisClient = new Redis({ url, token }) as unknown as RedisLike;
  } else {
    console.warn('[Vitryne Redis] Modo Mock Ativo (Memória local para testes/sandbox)');
    global.__redisClient = new InMemoryRedisMock() as RedisLike;
  }

  return global.__redisClient;
}

export const redis: RedisLike = getRedisClient();
