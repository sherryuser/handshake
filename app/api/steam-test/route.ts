import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const steamApiKey = process.env.STEAM_API_KEY
    const testSteamId = '76561198046783516' // Known public Steam profile
    
    const debug = {
      steamApiKey: {
        present: !!steamApiKey,
        value: steamApiKey === 'DEMO_MODE' ? 'DEMO_MODE' : steamApiKey ? `${steamApiKey.slice(0, 8)}...` : 'MISSING',
        length: steamApiKey?.length || 0
      },
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    }

    if (!steamApiKey || steamApiKey === 'DEMO_MODE') {
      return NextResponse.json({
        success: false,
        error: 'Steam API key is missing or in demo mode',
        debug,
        solution: 'Set STEAM_API_KEY environment variable in Vercel dashboard'
      })
    }

    // Test actual Steam API call
    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${testSteamId}`
    
    console.log('Testing Steam API with URL:', steamApiUrl.replace(steamApiKey, 'HIDDEN_KEY'))
    
    const steamResponse = await fetch(steamApiUrl, {
      headers: {
        'User-Agent': 'SteamHandshakeApp/1.0',
      },
    })

    const steamData = await steamResponse.json()
    
    return NextResponse.json({
      success: true,
      steamApiResponse: {
        status: steamResponse.status,
        statusText: steamResponse.statusText,
        data: steamData
      },
      debug,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
