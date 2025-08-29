import { NextResponse } from 'next/server'
import { SteamAPI } from '@/lib/steam-api'

export const dynamic = 'force-dynamic'

interface ProPlayerResult {
  general: {
    profile_url: string
    nick_name: string
  }
}

interface CSMarketCapResponse {
  data: {
    getProPlayers: {
      max_pages: number
      result: ProPlayerResult[]
    }
  }
}

export async function GET() {
  try {
    const query = `
      query($pagination: ProPlayersPaginationInput!) {
        getProPlayers(pagination: $pagination) {
          max_pages
          result {
            general {
              profile_url
              nick_name
            }
          }
        }
      }
    `

    const variables = {
      pagination: {
        page: 1,
        per_page: 50
      }
    }

    const response = await fetch('https://api.csmarketcap.com/api/v2/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-white-list-key': 'LLQH2hdyzMqrkpZIPqve',
      },
      body: JSON.stringify({
        query,
        variables
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: CSMarketCapResponse = await response.json()
    
    if (!data.data?.getProPlayers?.result) {
      throw new Error('Invalid response format')
    }

    // Transform the data to match our ProPlayer interface
    const proPlayers = await Promise.all(
      data.data.getProPlayers.result
        .filter(player => player.general.profile_url && player.general.nick_name)
        .slice(0, 30) // Limit to 30 players
        .map(async player => {
          // Extract Steam ID from profile URL
          let steamId64 = null
          
          // Try to extract Steam ID64 from profiles URL
          const profilesMatch = player.general.profile_url.match(/steamcommunity\.com\/profiles\/(\d+)/)
          if (profilesMatch) {
            steamId64 = profilesMatch[1]
          } else {
            // If it's a vanity URL, try to resolve it
            const vanityMatch = player.general.profile_url.match(/steamcommunity\.com\/id\/([^\/]+)/)
            if (vanityMatch) {
              const vanityUrl = vanityMatch[1]
              try {
                // Only try to resolve if we have a valid Steam API key
                if (process.env.STEAM_API_KEY && process.env.STEAM_API_KEY !== 'DEMO_MODE') {
                  steamId64 = await SteamAPI.resolveVanityURL(vanityUrl)
                }
                
                // If resolution failed, keep the vanity URL for now
                if (!steamId64) {
                  steamId64 = vanityUrl
                }
              } catch (error) {
                console.log('Could not resolve vanity URL:', vanityUrl, error)
                steamId64 = vanityUrl
              }
            }
          }
          
          return {
            id64: steamId64 || `csmc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            handle: player.general.nick_name,
            team: null, // CS Market Cap doesn't provide team info in this endpoint
            aliases: [player.general.nick_name],
            profile_url: player.general.profile_url
          }
        })
    )

    return NextResponse.json({
      pros: proPlayers,
      count: proPlayers.length,
      source: 'csmarketcap',
      max_pages: data.data.getProPlayers.max_pages
    })

  } catch (error) {
    console.error('CS Market Cap API error:', error)
    
    // Return fallback static data if API fails
    const fallbackPros = [
      {
        id64: '76561198010511021',
        handle: 's1mple',
        team: 'NAVI',
        aliases: ['s1mple', 'Aleksandr Kostyliev'],
        profile_url: 'https://steamcommunity.com/profiles/76561198010511021'
      },
      {
        id64: '76561198034202275',
        handle: 'ZywOo',
        team: 'G2',
        aliases: ['ZywOo', 'Mathieu Herbaut'],
        profile_url: 'https://steamcommunity.com/profiles/76561198034202275'
      }
    ]

    return NextResponse.json({
      pros: fallbackPros,
      count: fallbackPros.length,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
