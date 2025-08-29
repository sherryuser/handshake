export interface SteamUser {
  steamid: string
  personaname: string
  avatar: string
  avatarmedium: string
  avatarfull: string
  profileurl: string
  personastate?: number
  communityvisibilitystate?: number
}

export interface ProPlayer {
  id64: string
  handle: string
  team?: string | null
  aliases: string[]
  profile_url?: string
}

export interface HandshakeResult {
  success: boolean
  degree: number | null
  path: SteamUser[]
  alternativePaths?: SteamUser[][]
  errorMessage?: string
  stats?: {
    searchTime: number
    nodesExplored: number
    cacheHits: number
  }
}

export interface SearchRequest {
  source: string
  target: string
}

export interface SearchResponse extends HandshakeResult {
  searchId: string
  targetUser: SteamUser
  requesterUser: SteamUser
}

export interface CachedFriendList {
  steamid: string
  friends: string[]
  timestamp: number
  isPrivate: boolean
}

export interface BFSNode {
  steamid: string
  distance: number
  parent?: string
  direction: 'forward' | 'backward'
}

export interface PathNode {
  user: SteamUser
  isConnection?: boolean
}

export interface ShareableResult {
  id: string
  requester: SteamUser
  target: SteamUser
  degree: number
  path: SteamUser[]
  createdAt: string
}
