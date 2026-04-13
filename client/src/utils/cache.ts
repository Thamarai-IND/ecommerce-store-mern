const CACHE_PREFIX = 'ecommerce_';
const CACHE_EXPIRY_TIME = 1000 * 60 * 5; // 5 minutes default

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  static set<T>(key: string, data: T, ttl: number = CACHE_EXPIRY_TIME): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl;

      if (isExpired) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  static removePattern(pattern: string): void {
    try {
      const regex = new RegExp(pattern);
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX) && regex.test(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache pattern remove error:', error);
    }
  }
}
