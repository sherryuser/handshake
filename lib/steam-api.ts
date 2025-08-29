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
      const cacheKeys = steamIds.map(id => `user:${id}`)
      const cached = await redis.mget(...cacheKeys)
      const results: SteamUser[] = []
      const uncachedIds: string[] = []
      
      cached.forEach((item, index) => {
        if (item) {
          results[index] = JSON.parse(item as string)
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
      const cached = await redis.get(cacheKey) as string | null
      
      if (cached) {
        const cachedData: CachedFriendList = JSON.parse(cached)
        return cachedData.friendIds
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
          steamId,
          friendIds,
          cachedAt: new Date()
        }
        await redis.setex(cacheKey, 1800, JSON.stringify(cacheData)) // 30 minutes
        
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