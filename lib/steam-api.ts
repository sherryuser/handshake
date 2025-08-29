import { SteamUser, CachedFriendList } from '@/types'
import { redis } from './redis'

const STEAM_API_KEY = process.env.STEAM_API_KEY!
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
      const url = `${BASE_URL}/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanityUrl}`
      const response = await this.fetchWithRetry(url)
      const data = await response.json()
      
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
      const cacheKey = `user:${steamId}`
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached as string)
      }

      const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
      const response = await this.fetchWithRetry(url)
      const data = await response.json()
      
      if (data.response?.players?.length > 0) {
        const user = data.response.players[0]
        
        // Cache for 1 hour
        await redis.setex(cacheKey, 3600, JSON.stringify(user))
        
        return user
      }
      
      return null
    } catch (error) {
      console.error('Error fetching user summary:', error)
      return null
    }
  }

  static async getUserSummaries(steamIds: string[]): Promise<SteamUser[]> {
    if (steamIds.length === 0) return []
    
    try {
      // Check cache first
      const users: SteamUser[] = []
      const uncachedIds: string[] = []
      
      for (const steamId of steamIds) {
        const cacheKey = `user:${steamId}`
        const cached = await redis.get(cacheKey)
        
        if (cached) {
          users.push(JSON.parse(cached as string))
        } else {
          uncachedIds.push(steamId)
        }
      }
      
      // Fetch uncached users
      if (uncachedIds.length > 0) {
        const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${uncachedIds.join(',')}`
        const response = await this.fetchWithRetry(url)
        const data = await response.json()
        
        if (data.response?.players) {
          for (const user of data.response.players) {
            users.push(user)
            
            // Cache for 1 hour
            const cacheKey = `user:${user.steamid}`
            await redis.setex(cacheKey, 3600, JSON.stringify(user))
          }
        }
      }
      
      return users
    } catch (error) {
      console.error('Error fetching user summaries:', error)
      return []
    }
  }

  static async getFriendList(steamId: string): Promise<CachedFriendList> {
    try {
      const cacheKey = `friends:${steamId}`
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached as string)
      }

      const url = `${BASE_URL}/ISteamUser/GetFriendList/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&relationship=friend`
      const response = await this.fetchWithRetry(url)
      
      if (response.status === 401 || response.status === 403) {
        // Private profile
        const result: CachedFriendList = {
          steamid: steamId,
          friends: [],
          timestamp: Date.now(),
          isPrivate: true
        }
        
        // Cache private profile status for 1 day
        await redis.setex(cacheKey, 86400, JSON.stringify(result))
        return result
      }
      
      const data = await response.json()
      const friends = data.friendslist?.friends?.map((friend: any) => friend.steamid) || []
      
      const result: CachedFriendList = {
        steamid: steamId,
        friends: friends.slice(0, 300), // Limit to prevent excessive branching
        timestamp: Date.now(),
        isPrivate: false
      }
      
      // Cache for 7 days
      await redis.setex(cacheKey, 604800, JSON.stringify(result))
      
      return result
    } catch (error) {
      console.error('Error fetching friend list:', error)
      return {
        steamid: steamId,
        friends: [],
        timestamp: Date.now(),
        isPrivate: true
      }
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
