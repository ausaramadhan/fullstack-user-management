// src/config/redis.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
});

redis.on('connect', () => {
  console.log('[REDIS] connected');
});

redis.on('error', (err) => {
  console.error('[REDIS ERROR]', err);
});

export default redis;
