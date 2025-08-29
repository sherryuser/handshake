import { NextRequest, NextResponse } from 'next/server'
import { SteamAPI } from '@/lib/steam-api'
import { formatSteamId, isSteamId64, extractSteamIdFromUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const steamId = searchParams.get('steamId') || '76561198046783516'

  try {
    const debug = {
      input: steamId,
      steamApiKey: process.env.STEAM_API_KEY ? 'PRESENT' : 'MISSING',
      steamApiKeyValue: process.env.STEAM_API_KEY === 'DEMO_MODE' ? 'DEMO_MODE' : process.env.STEAM_API_KEY ? 'SET' : 'MISSING',
      formatted: formatSteamId(steamId),
      isValid: isSteamId64(formatSteamId(steamId)),
    }

    // Test Steam API calls
    let userSummary = null
    let friendsList = null
    let vanityResolution = null

    try {
      if (debug.isValid) {
        userSummary = await SteamAPI.getUserSummary(debug.formatted)
        friendsList = await SteamAPI.getFriendsList(debug.formatted)
      } else {
        vanityResolution = await SteamAPI.resolveVanityURL(debug.formatted)
      }
    } catch (apiError) {
      debug.apiError = (apiError as Error).message
    }

    return NextResponse.json({
      debug,
      userSummary,
      friendsList: friendsList ? `${friendsList.length} friends` : null,
      vanityResolution,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      error: (error as Error).message,
      steamId,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source, target } = body

    const debug = {
      originalInput: { source, target },
      steamApiKey: process.env.STEAM_API_KEY ? 'PRESENT' : 'MISSING',
      processedSource: {
        raw: source,
        extracted: source.includes('steamcommunity.com') ? extractSteamIdFromUrl(source) : null,
        formatted: formatSteamId(source.includes('steamcommunity.com') ? extractSteamIdFromUrl(source) || source : source),
      },
      processedTarget: {
        raw: target,
        extracted: target.includes('steamcommunity.com') ? extractSteamIdFromUrl(target) : null,
        formatted: formatSteamId(target.includes('steamcommunity.com') ? extractSteamIdFromUrl(target) || target : target),
      }
    }

    debug.processedSource.isValid = isSteamId64(debug.processedSource.formatted)
    debug.processedTarget.isValid = isSteamId64(debug.processedTarget.formatted)

    return NextResponse.json({
      debug,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
