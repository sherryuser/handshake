import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const STEAM_API_KEY = process.env.STEAM_API_KEY || 'F2D6AEBB4CC99E083ED54026DA5A3049'
    const BASE_URL = 'https://api.steampowered.com'
    const steamId = '76561198046783516'
    
    console.log('Testing Steam API directly...')
    console.log('Steam API Key:', STEAM_API_KEY.slice(0, 8) + '...' + STEAM_API_KEY.slice(-4))
    
    const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
    console.log('URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SteamHandshakeApp/1.0',
      },
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))
    
    return NextResponse.json({
      success: true,
      status: response.status,
      data,
      debug: {
        url,
        steamApiKey: STEAM_API_KEY.slice(0, 8) + '...' + STEAM_API_KEY.slice(-4),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Debug Steam API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
