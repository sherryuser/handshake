import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('Redis environment variables not set. Using mock Redis client.')
}

class MockRedis {
  private cache = new Map<string, { value: any; expiry?: number }>()

  async get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  async set(key: string, value: any) {
    this.cache.set(key, { value })
    return 'OK'
  }

  async setex(key: string, seconds: number, value: any) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + seconds * 1000
    })
    return 'OK'
  }

  async del(key: string) {
    return this.cache.delete(key) ? 1 : 0
  }

  async exists(key: string) {
    return this.cache.has(key) ? 1 : 0
  }

  async ttl(key: string) {
    const item = this.cache.get(key)
    if (!item || !item.expiry) return -1
    
    const remaining = Math.ceil((item.expiry - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  }
}

export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : new MockRedis() as any
