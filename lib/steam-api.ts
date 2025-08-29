import { SteamUser, CachedFriendList } from '@/types'
import { redis } from './redis'

const STEAM_API_KEY = process.env.STEAM_API_KEY || 'F2D6AEBB4CC99E083ED54026DA5A3049'
const BASE_URL = 'https://api.steampowered.com'

export class SteamAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'SteamAPIError'
  }
}

export class SteamAPI {
  private static async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'SteamHandshakeApp/1.0',
          },
        })
        
        if (response.ok) {
          return response
        }
        
        if (response.status === 429) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
          continue
        }
        
        throw new SteamAPIError(`HTTP ${response.status}: ${response.statusText}`, response.status)
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)))
      }
    }
    
    throw new SteamAPIError('Max retries exceeded')
  }

  static async resolveVanityURL(vanityUrl: string): Promise<string | null> {
    try {
      // Check if Steam API key is available
      if (!STEAM_API_KEY || STEAM_API_KEY === 'DEMO_MODE') {
        console.error('Steam API key is missing or in demo mode - cannot resolve vanity URL')
        return null
      }

      const url = `${BASE_URL}/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanityUrl}`
      console.log('Resolving vanity URL:', vanityUrl)
      
      const response = await this.fetchWithRetry(url)
      const data = await response.json()
      
      console.log('Vanity URL resolution result:', {
        vanityUrl,
        success: data.response?.success === 1,
        steamId: data.response?.steamid
      })
      
      if (data.response?.success === 1) {
        return data.response.steamid
      }
      
      return null
    } catch (error) {
      console.error('Error resolving vanity URL:', error)
      return null
    }
  }

  static async getUserSummary(steamId: string): Promise<SteamUser | null> {
    try {
      // Check if Steam API key is available
      if (!STEAM_API_KEY || STEAM_API_KEY === 'DEMO_MODE') {
        console.error('Steam API key is missing or in demo mode')
        return null
      }

      console.log('Using Steam API key:', STEAM_API_KEY.slice(0, 8) + '...' + STEAM_API_KEY.slice(-4))

      const cacheKey = `user:${steamId}`
      
      // Try to get from cache, but don't fail if Redis is down
      let cached = null
      try {
        cached = await redis.get(cacheKey)
        if (cached) {
          console.log('Found user in cache:', steamId)
          return JSON.parse(cached as string)
        }
      } catch (redisError) {
        console.warn('Redis cache failed, continuing without cache:', redisError)
      }

      const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
      console.log('Fetching user summary for:', steamId)
      
      const response = await this.fetchWithRetry(url)
      const data = await response.json()
      
      console.log('Steam API response for user summary:', {
        status: response.status,
        hasPlayers: !!data.response?.players?.length,
        playerCount: data.response?.players?.length || 0,
        fullResponse: data
      })
      
      if (data.response?.players?.length > 0) {
        const user = data.response.players[0]
        
        // Try to cache for 1 hour, but don't fail if Redis is down
        try {
          await redis.setex(cacheKey, 3600, JSON.stringify(user))
        } catch (redisError) {
          console.warn('Failed to cache user data, continuing without cache:', redisError)
        }
        
        return user
      }
      
      return null
    } catch (error) {
      console.error('Error fetching user summary for', steamId, ':', error)
      return null
    }
  }

  static async getUserSummaries(steamIds: string[]): Promise<SteamUser[]> {
    if (steamIds.length === 0) return []
    
    try {
      // Check cache first
      const cacheKeys = steamIds.map(id => `user:${id}`)
      const cached = await redis.mget(...cacheKeys)
      const results: SteamUser[] = []
      const uncachedIds: string[] = []
      
      cached.forEach((item: string | null, index: number) => {
        if (item) {
          results[index] = JSON.parse(item)
        } else {
          uncachedIds.push(steamIds[index])
        }
      })
      
      if (uncachedIds.length > 0) {
        const steamIdsParam = uncachedIds.join(',')
        const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamIdsParam}`
        const response = await this.fetchWithRetry(url)
        const data = await response.json()
        
        if (data.response?.players) {
          const users = data.response.players
          
          // Cache the results
          const cachePromises = users.map((user: SteamUser) => 
            redis.setex(`user:${user.steamid}`, 3600, JSON.stringify(user))
          )
          await Promise.all(cachePromises)
          
          // Fill in the results array
          users.forEach((user: SteamUser) => {
            const index = steamIds.indexOf(user.steamid)
            if (index !== -1) {
              results[index] = user
            }
          })
        }
      }
      
      return results.filter(Boolean) // Remove any undefined entries
    } catch (error) {
      console.error('Error fetching user summaries:', error)
      return []
    }
  }

  static async getFriendsList(steamId: string): Promise<string[]> {
    try {
      // Check cache first (cache for 30 minutes)
      const cacheKey = `friends:${steamId}`
      let cached = null
      
      try {
        cached = await redis.get(cacheKey) as string | null
        if (cached) {
          const cachedData: CachedFriendList = JSON.parse(cached)
          return cachedData.friends
        }
      } catch (redisError) {
        console.warn('Redis cache failed for friends list, continuing without cache:', redisError)
      }

      const url = `${BASE_URL}/ISteamUser/GetFriendList/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&relationship=friend`
      const response = await this.fetchWithRetry(url)
      
      if (response.status === 401) {
        // Private profile
        return []
      }
      
      const data = await response.json()
      
      if (data.friendslist?.friends) {
        const friendIds = data.friendslist.friends.map((friend: any) => friend.steamid)
        
        // Cache the result
        const cacheData: CachedFriendList = {
          steamid: steamId,
          friends: friendIds,
          timestamp: Date.now(),
          isPrivate: false
        }
        try {
          await redis.setex(cacheKey, 1800, JSON.stringify(cacheData)) // 30 minutes
        } catch (redisError) {
          console.warn('Failed to cache friends list, continuing without cache:', redisError)
        }
        
        return friendIds
      }
      
      return []
    } catch (error) {
      console.error('Error fetching friends list:', error)
      return []
    }
  }

  static async isProfilePublic(steamId: string): Promise<boolean> {
    try {
      const user = await this.getUserSummary(steamId)
      return user?.communityvisibilitystate === 3
    } catch (error) {
      return false
    }
  }
}