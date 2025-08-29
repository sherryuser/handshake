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
        value: steamApiKey === 'DEMO_MODE' ? 'DEMO_MODE' : steamApiKey ? `${steamApiKey.slice(0, 8)}...${steamApiKey.slice(-4)}` : 'MISSING',
        length: steamApiKey?.length || 0,
        isExpectedKey: steamApiKey === 'F2D6AEBB4CC99E083ED54026DA5A3049'
      },
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('STEAM')),
      vercelKeys: {
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL
      }
    }

    if (!steamApiKey || steamApiKey === 'DEMO_MODE') {
      return NextResponse.json({
        success: false,
        error: 'Steam API key is missing or in demo mode',
        debug,
        solution: 'Set STEAM_API_KEY environment variable in Vercel dashboard'
      })
    }

    // Test actual Steam API call with environment key
    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${testSteamId}`
    
    console.log('Testing Steam API with URL:', steamApiUrl.replace(steamApiKey, 'HIDDEN_KEY'))
    
    const steamResponse = await fetch(steamApiUrl, {
      headers: {
        'User-Agent': 'SteamHandshakeApp/1.0',
      },
    })

    const steamData = await steamResponse.json()

    // Also test with hardcoded key as fallback
    const fallbackKey = 'F2D6AEBB4CC99E083ED54026DA5A3049'
    const fallbackUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${fallbackKey}&steamids=${testSteamId}`
    
    const fallbackResponse = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': 'SteamHandshakeApp/1.0',
      },
    })

    const fallbackData = await fallbackResponse.json()
    
    return NextResponse.json({
      success: true,
      environmentKeyTest: {
        status: steamResponse.status,
        statusText: steamResponse.statusText,
        data: steamData,
        worked: !!steamData.response?.players?.length
      },
      fallbackKeyTest: {
        status: fallbackResponse.status,
        statusText: fallbackResponse.statusText,
        data: fallbackData,
        worked: !!fallbackData.response?.players?.length
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
