import { HandshakeResult, BFSNode, SteamUser } from '@/types'
import { SteamAPI } from './steam-api'
import { redis } from './redis'

const MAX_DEPTH = 4
const MAX_NODES_PER_LEVEL = 300
const CACHE_TTL = 86400 // 1 day

export class HandshakeAlgorithm {
  private static async getCachedResult(source: string, target: string): Promise<HandshakeResult | null> {
    try {
      const cacheKey = `handshake:${source}:${target}`
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached as string)
      }
      
      // Try reverse direction
      const reverseCacheKey = `handshake:${target}:${source}`
      const reverseCached = await redis.get(reverseCacheKey)
      
      if (reverseCached) {
        const result = JSON.parse(reverseCached as string) as HandshakeResult
        // Reverse the path
        if (result.success && result.path) {
          result.path = result.path.reverse()
        }
        return result
      }
      
      return null
    } catch (error) {
      console.error('Error getting cached result:', error)
      return null
    }
  }

  private static async setCachedResult(source: string, target: string, result: HandshakeResult): Promise<void> {
    try {
      const cacheKey = `handshake:${source}:${target}`
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result))
    } catch (error) {
      console.error('Error setting cached result:', error)
    }
  }

  static async findShortestPath(sourceId: string, targetId: string): Promise<HandshakeResult> {
    const startTime = Date.now()
    let nodesExplored = 0
    let cacheHits = 0

    try {
      // Check if we have a cached result
      const cached = await this.getCachedResult(sourceId, targetId)
      if (cached) {
        return {
          ...cached,
          stats: {
            searchTime: Date.now() - startTime,
            nodesExplored: 0,
            cacheHits: 1
          }
        }
      }

      // Same user check
      if (sourceId === targetId) {
        const user = await SteamAPI.getUserSummary(sourceId)
        if (!user) {
          return {
            success: false,
            degree: null,
            path: [],
            errorMessage: 'User not found'
          }
        }

        const result: HandshakeResult = {
          success: true,
          degree: 0,
          path: [user]
        }

        await this.setCachedResult(sourceId, targetId, result)
        return result
      }

      // Check if profiles are public
      const [sourceUser, targetUser] = await Promise.all([
        SteamAPI.getUserSummary(sourceId),
        SteamAPI.getUserSummary(targetId)
      ])

      if (!sourceUser) {
        return {
          success: false,
          degree: null,
          path: [],
          errorMessage: 'Source user not found'
        }
      }

      if (!targetUser) {
        return {
          success: false,
          degree: null,
          path: [],
          errorMessage: 'Target user not found'
        }
      }

      // Get initial friend lists
      const [sourceFriends, targetFriends] = await Promise.all([
        SteamAPI.getFriendList(sourceId),
        SteamAPI.getFriendList(targetId)
      ])

      if (sourceFriends.isPrivate) {
        const result: HandshakeResult = {
          success: false,
          degree: null,
          path: [],
          errorMessage: 'Source profile is private'
        }
        await this.setCachedResult(sourceId, targetId, result)
        return result
      }

      if (targetFriends.isPrivate) {
        const result: HandshakeResult = {
          success: false,
          degree: null,
          path: [],
          errorMessage: 'Target profile is private'
        }
        await this.setCachedResult(sourceId, targetId, result)
        return result
      }

      // Check for direct friendship (1 degree)
      if (sourceFriends.friends.includes(targetId)) {
        const result: HandshakeResult = {
          success: true,
          degree: 1,
          path: [sourceUser, targetUser]
        }
        await this.setCachedResult(sourceId, targetId, result)
        return result
      }

      // Bidirectional BFS
      const forwardQueue: BFSNode[] = [{ steamid: sourceId, distance: 0, direction: 'forward' }]
      const backwardQueue: BFSNode[] = [{ steamid: targetId, distance: 0, direction: 'backward' }]
      
      const forwardVisited = new Map<string, BFSNode>()
      const backwardVisited = new Map<string, BFSNode>()
      
      forwardVisited.set(sourceId, forwardQueue[0])
      backwardVisited.set(targetId, backwardQueue[0])

      while (forwardQueue.length > 0 || backwardQueue.length > 0) {
        // Expand forward
        if (forwardQueue.length > 0) {
          const meetingPoint = await this.expandLevel(
            forwardQueue,
            forwardVisited,
            backwardVisited,
            'forward',
            MAX_DEPTH / 2
          )
          
          if (meetingPoint) {
            const path = await this.reconstructPath(meetingPoint, forwardVisited, backwardVisited, sourceUser, targetUser)
            const result: HandshakeResult = {
              success: true,
              degree: path.length - 1,
              path,
              stats: {
                searchTime: Date.now() - startTime,
                nodesExplored,
                cacheHits
              }
            }
            await this.setCachedResult(sourceId, targetId, result)
            return result
          }
        }

        // Expand backward
        if (backwardQueue.length > 0) {
          const meetingPoint = await this.expandLevel(
            backwardQueue,
            backwardVisited,
            forwardVisited,
            'backward',
            MAX_DEPTH / 2
          )
          
          if (meetingPoint) {
            const path = await this.reconstructPath(meetingPoint, forwardVisited, backwardVisited, sourceUser, targetUser)
            const result: HandshakeResult = {
              success: true,
              degree: path.length - 1,
              path,
              stats: {
                searchTime: Date.now() - startTime,
                nodesExplored,
                cacheHits
              }
            }
            await this.setCachedResult(sourceId, targetId, result)
            return result
          }
        }

        nodesExplored++
      }

      // No path found
      const result: HandshakeResult = {
        success: false,
        degree: null,
        path: [],
        errorMessage: `No connection found within ${MAX_DEPTH} degrees`,
        stats: {
          searchTime: Date.now() - startTime,
          nodesExplored,
          cacheHits
        }
      }

      await this.setCachedResult(sourceId, targetId, result)
      return result

    } catch (error) {
      console.error('Error in handshake algorithm:', error)
      return {
        success: false,
        degree: null,
        path: [],
        errorMessage: 'An error occurred during the search',
        stats: {
          searchTime: Date.now() - startTime,
          nodesExplored,
          cacheHits
        }
      }
    }
  }

  private static async expandLevel(
    queue: BFSNode[],
    ownVisited: Map<string, BFSNode>,
    otherVisited: Map<string, BFSNode>,
    direction: 'forward' | 'backward',
    maxDepth: number
  ): Promise<string | null> {
    const currentLevelSize = queue.length
    
    for (let i = 0; i < currentLevelSize; i++) {
      const current = queue.shift()!
      
      if (current.distance >= maxDepth) continue

      const friendList = await SteamAPI.getFriendList(current.steamid)
      
      if (friendList.isPrivate) continue

      // Limit friends to prevent explosion
      const friends = friendList.friends.slice(0, MAX_NODES_PER_LEVEL)
      
      for (const friendId of friends) {
        // Check if we've met the other search
        if (otherVisited.has(friendId)) {
          return friendId
        }
        
        // Skip if already visited
        if (ownVisited.has(friendId)) continue
        
        const node: BFSNode = {
          steamid: friendId,
          distance: current.distance + 1,
          parent: current.steamid,
          direction
        }
        
        ownVisited.set(friendId, node)
        queue.push(node)
      }
    }
    
    return null
  }

  private static async reconstructPath(
    meetingPoint: string,
    forwardVisited: Map<string, BFSNode>,
    backwardVisited: Map<string, BFSNode>,
    sourceUser: SteamUser,
    targetUser: SteamUser
  ): Promise<SteamUser[]> {
    const pathIds: string[] = []
    
    // Build forward path
    const forwardPath: string[] = []
    let current = forwardVisited.get(meetingPoint)
    while (current && current.parent) {
      forwardPath.unshift(current.steamid)
      current = forwardVisited.get(current.parent)
    }
    forwardPath.unshift(sourceUser.steamid)
    
    // Build backward path
    const backwardPath: string[] = []
    current = backwardVisited.get(meetingPoint)
    while (current && current.parent) {
      backwardPath.push(current.steamid)
      current = backwardVisited.get(current.parent)
    }
    backwardPath.push(targetUser.steamid)
    
    // Combine paths
    pathIds.push(...forwardPath, ...backwardPath)
    
    // Remove duplicates while preserving order
    const uniquePathIds = []
    const seen = new Set()
    for (const id of pathIds) {
      if (!seen.has(id)) {
        seen.add(id)
        uniquePathIds.push(id)
      }
    }
    
    // Fetch user data for the path
    const users = await SteamAPI.getUserSummaries(uniquePathIds)
    
    // Maintain order
    const orderedUsers = uniquePathIds.map(id => 
      users.find(user => user.steamid === id)
    ).filter(Boolean) as SteamUser[]
    
    return orderedUsers
  }
}
