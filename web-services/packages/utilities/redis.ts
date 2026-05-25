import IORedis from "ioredis";
import { Queue } from "bullmq";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

export function getRedisConnection(): IORedis {
  return connection;
}

export function createQueue(name: string): Queue {
  return new Queue(name, { connection });
}

export { connection as redisConnection };
