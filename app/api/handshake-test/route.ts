import { NextRequest, NextResponse } from 'next/server'
import { SteamAPI } from '@/lib/steam-api'
import { formatSteamId, isSteamId64, extractSteamIdFromUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source, target } = body

    console.log('=== HANDSHAKE TEST DEBUG ===')
    console.log('Input:', { source, target })

    // Step 1: Process inputs
    let sourceInput = source
    let targetInput = target

    if (source?.includes('steamcommunity.com')) {
      const extracted = extractSteamIdFromUrl(source)
      if (extracted) sourceInput = extracted
    }

    if (target?.includes('steamcommunity.com')) {
      const extracted = extractSteamIdFromUrl(target)
      if (extracted) targetInput = extracted
    }

    console.log('Extracted:', { sourceInput, targetInput })

    // Step 2: Format Steam IDs
    const sourceId = formatSteamId(sourceInput)
    const targetId = formatSteamId(targetInput)

    console.log('Formatted:', { sourceId, targetId })

    // Step 3: Validate Steam IDs
    const sourceValid = isSteamId64(sourceId)
    const targetValid = isSteamId64(targetId)

    console.log('Validation:', { sourceValid, targetValid })

    // Step 4: Test user fetching
    let sourceUser = null
    let targetUser = null
    let sourceFriends = null
    let targetFriends = null

    if (sourceValid) {
      console.log('Fetching source user:', sourceId)
      sourceUser = await SteamAPI.getUserSummary(sourceId)
      console.log('Source user result:', !!sourceUser, sourceUser?.personaname)

      if (sourceUser) {
        console.log('Fetching source friends for:', sourceId)
        sourceFriends = await SteamAPI.getFriendsList(sourceId)
        console.log('Source friends count:', sourceFriends?.length || 0)
      }
    }

    if (targetValid) {
      console.log('Fetching target user:', targetId)
      targetUser = await SteamAPI.getUserSummary(targetId)
      console.log('Target user result:', !!targetUser, targetUser?.personaname)

      if (targetUser) {
        console.log('Fetching target friends for:', targetId)
        targetFriends = await SteamAPI.getFriendsList(targetId)
        console.log('Target friends count:', targetFriends?.length || 0)
      }
    }

    // Step 5: Check for direct connection
    let directConnection = false
    if (sourceFriends && targetFriends && sourceFriends.length > 0) {
      directConnection = sourceFriends.includes(targetId)
      console.log('Direct connection check:', directConnection)
    }

    return NextResponse.json({
      success: true,
      steps: {
        input: { source, target },
        extracted: { sourceInput, targetInput },
        formatted: { sourceId, targetId },
        validation: { sourceValid, targetValid },
        users: {
          source: sourceUser ? { steamid: sourceUser.steamid, name: sourceUser.personaname } : null,
          target: targetUser ? { steamid: targetUser.steamid, name: targetUser.personaname } : null
        },
        friends: {
          sourceFriendsCount: sourceFriends?.length || 0,
          targetFriendsCount: targetFriends?.length || 0,
          directConnection
        }
      },
      errors: {
        sourceUserMissing: !sourceUser && sourceValid,
        targetUserMissing: !targetUser && targetValid,
        sourceFriendsEmpty: sourceFriends?.length === 0,
        targetFriendsEmpty: targetFriends?.length === 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Handshake test error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
