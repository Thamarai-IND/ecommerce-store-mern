import { createClient } from "redis";
import { config } from "../config/env.js";

let redisClient: ReturnType<typeof createClient> | null = null;

export const initRedis = async (): Promise<void> => {
  try {
    const client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        // Avoid infinite retry loop when Redis is not running locally.
        reconnectStrategy: false,
      },
      password: config.redis.password || undefined,
    });

    client.on("error", (err) => console.warn("Redis unavailable, caching disabled:", err.message));
    client.on("connect", () => console.log("✓ Redis connected"));

    await client.connect();
    redisClient = client;
  } catch (error) {
    console.warn("⚠ Redis connection failed, caching disabled:", error);
    redisClient = null;
  }
};

export const getRedisClient = (): ReturnType<typeof createClient> | null => redisClient;

export const setCache = async (key: string, value: any, ttl: number = config.cacheTTL.default): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error("Cache set error:", error);
  }
};

export const getCache = async (key: string): Promise<any | null> => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error("Cache delete error:", error);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Cache pattern delete error:", error);
  }
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    console.log("✓ Redis connection closed");
  }
};
