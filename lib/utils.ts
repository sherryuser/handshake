import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSteamId(steamId: string): string {
  // Convert various Steam ID formats to SteamID64
  if (steamId.startsWith('STEAM_')) {
    // STEAM_0:0:123456789 format
    const parts = steamId.split(':')
    if (parts.length === 3) {
      const accountId = parseInt(parts[2]) * 2 + parseInt(parts[1])
      return (BigInt(accountId) + BigInt('76561197960265728')).toString()
    }
  }
  
  if (steamId.startsWith('[U:1:') && steamId.endsWith(']')) {
    // [U:1:123456789] format
    const accountId = steamId.slice(5, -1)
    return (BigInt(accountId) + BigInt('76561197960265728')).toString()
  }
  
  // Assume it's already SteamID64 or a custom URL
  return steamId
}

export function isSteamId64(steamId: string): boolean {
  return /^7656119\d{10}$/.test(steamId)
}

export function isValidSteamUrl(url: string): boolean {
  return /^https:\/\/steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/.test(url)
}

export function extractSteamIdFromUrl(url: string): string | null {
  const match = url.match(/steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9_-]+)/)
  return match ? match[2] : null
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
