import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SteamAPI } from '@/lib/steam-api'

export const dynamic = 'force-dynamic'

const profileRequestSchema = z.object({
  ids: z.string().min(1, 'Steam IDs are required'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Steam IDs parameter is required' },
        { status: 400 }
      )
    }

    const { ids } = profileRequestSchema.parse({ ids: idsParam })
    const steamIds = ids.split(',').map(id => id.trim()).filter(Boolean)

    if (steamIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one Steam ID is required' },
        { status: 400 }
      )
    }

    if (steamIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 Steam IDs allowed per request' },
        { status: 400 }
      )
    }

    // Fetch user summaries (temporarily using individual calls)
    console.log('Fetching users for IDs:', steamIds)
    const userPromises = steamIds.map(id => SteamAPI.getUserSummary(id))
    const userResults = await Promise.all(userPromises)
    const users = userResults.filter(Boolean) // Remove null results
    console.log('Fetched users:', users.length, 'out of', steamIds.length)

    return NextResponse.json({
      users,
      count: users.length,
    })

  } catch (error) {
    console.error('Profile API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
