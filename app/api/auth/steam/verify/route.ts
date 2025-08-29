import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const verifyRequestSchema = z.object({
  steamId: z.string(),
  openidParams: z.record(z.string())
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { steamId, openidParams } = verifyRequestSchema.parse(body)

    // Verify the OpenID response with Steam
    const verificationParams = new URLSearchParams()
    
    // Add all the original params
    Object.entries(openidParams).forEach(([key, value]) => {
      verificationParams.append(key, value)
    })
    
    // Change mode to check_authentication for verification
    verificationParams.set('openid.mode', 'check_authentication')

    const verificationResponse = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verificationParams.toString()
    })

    const verificationResult = await verificationResponse.text()
    
    if (!verificationResult.includes('is_valid:true')) {
      return NextResponse.json({
        success: false,
        error: 'Steam authentication verification failed'
      }, { status: 400 })
    }

    // If verification passed, get user info from Steam API
    const STEAM_API_KEY = process.env.STEAM_API_KEY
    if (!STEAM_API_KEY || STEAM_API_KEY === 'DEMO_MODE') {
      // For demo mode, return mock user data
      return NextResponse.json({
        success: true,
        user: {
          steamid: steamId,
          personaname: 'Demo User',
          avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
        }
      })
    }

    // Get user profile from Steam API
    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
    const steamApiResponse = await fetch(steamApiUrl)
    const steamApiData = await steamApiResponse.json()

    if (!steamApiData.response?.players?.length) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch user profile from Steam'
      }, { status: 400 })
    }

    const user = steamApiData.response.players[0]

    return NextResponse.json({
      success: true,
      user: {
        steamid: user.steamid,
        personaname: user.personaname,
        avatar: user.avatarfull || user.avatar
      }
    })

  } catch (error) {
    console.error('Steam verification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
