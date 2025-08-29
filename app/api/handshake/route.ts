import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { HandshakeAlgorithm } from '@/lib/handshake-algorithm'
import { SteamAPI } from '@/lib/steam-api'
import { prisma } from '@/lib/prisma'
import { formatSteamId, isSteamId64, extractSteamIdFromUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const handshakeRequestSchema = z.object({
  source: z.string().min(1, 'Source Steam ID is required'),
  target: z.string().min(1, 'Target Steam ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source, target } = handshakeRequestSchema.parse(body)

    // Check if Steam API key is available
    if (!process.env.STEAM_API_KEY || process.env.STEAM_API_KEY === 'DEMO_MODE') {
      return NextResponse.json({
        success: false,
        errorMessage: 'Steam API is not available in demo mode. Please configure a valid Steam API key.',
        degree: null,
        path: null,
        stats: null,
        searchId: null,
        requesterUser: null,
        targetUser: null,
      })
    }

    console.log('Handshake request:', { source, target })

    // Extract Steam IDs from URLs if needed
    let sourceInput = source
    let targetInput = target

    // Handle Steam profile URLs
    if (source.includes('steamcommunity.com')) {
      const extracted = extractSteamIdFromUrl(source)
      if (extracted) {
        sourceInput = extracted
      }
    }

    if (target.includes('steamcommunity.com')) {
      const extracted = extractSteamIdFromUrl(target)
      if (extracted) {
        targetInput = extracted
      }
    }

    // Format and validate Steam IDs
    let sourceId = formatSteamId(sourceInput)
    let targetId = formatSteamId(targetInput)

    console.log('Formatted IDs:', { sourceId, targetId })

    // Handle vanity URLs and IDs that need resolution
    if (!isSteamId64(sourceId)) {
      console.log('Resolving source vanity URL:', sourceId)
      const resolvedId = await SteamAPI.resolveVanityURL(sourceId)
      console.log('Source resolved to:', resolvedId)
      if (!resolvedId) {
        return NextResponse.json(
          { error: 'Invalid source Steam ID or vanity URL' },
          { status: 400 }
        )
      }
      sourceId = resolvedId
    }

    if (!isSteamId64(targetId)) {
      console.log('Resolving target vanity URL:', targetId)
      const resolvedId = await SteamAPI.resolveVanityURL(targetId)
      console.log('Target resolved to:', resolvedId)
      if (!resolvedId) {
        return NextResponse.json(
          { error: 'Invalid target Steam ID or vanity URL' },
          { status: 400 }
        )
      }
      targetId = resolvedId
    }

    console.log('Final Steam IDs:', { sourceId, targetId })

    // Run the handshake algorithm
    const result = await HandshakeAlgorithm.findShortestPath(sourceId, targetId)

    // Get user summaries for response
    const [sourceUser, targetUser] = await Promise.all([
      SteamAPI.getUserSummary(sourceId),
      SteamAPI.getUserSummary(targetId)
    ])

    if (!sourceUser || !targetUser) {
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: 400 }
      )
    }

    // Save search to database
    try {
      await prisma.search.create({
        data: {
          requesterId: sourceId,
          targetId: targetId,
          degree: result.degree,
          success: result.success,
          path: result.path ? result.path.map(user => user.steamid) : undefined,
          errorMessage: result.errorMessage,
        }
      })

      // Update user records
      await Promise.all([
        prisma.user.upsert({
          where: { id64: sourceId },
          update: { 
            name: sourceUser.personaname,
            avatar: sourceUser.avatar,
            lastSeenAt: new Date()
          },
          create: {
            id64: sourceId,
            name: sourceUser.personaname,
            avatar: sourceUser.avatar,
          }
        }),
        prisma.user.upsert({
          where: { id64: targetId },
          update: { 
            name: targetUser.personaname,
            avatar: targetUser.avatar,
            lastSeenAt: new Date()
          },
          create: {
            id64: targetId,
            name: targetUser.personaname,
            avatar: targetUser.avatar,
          }
        })
      ])

      // Update search counter for target
      await prisma.counter.upsert({
        where: { entityId64: targetId },
        update: { searchCount: { increment: 1 } },
        create: { entityId64: targetId, searchCount: 1 }
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      // Continue without failing the request
    }

    // Generate search ID for sharing
    const searchId = `${sourceId}_${targetId}_${Date.now()}`

    return NextResponse.json({
      success: result.success,
      degree: result.degree,
      path: result.path,
      errorMessage: result.errorMessage,
      stats: result.stats,
      searchId,
      requesterUser: sourceUser,
      targetUser: targetUser,
    })

  } catch (error) {
    console.error('Handshake API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
