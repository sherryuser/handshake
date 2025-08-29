import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Clean up old search records
    const deletedSearches = await prisma.search.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        success: false // Keep successful searches longer
      }
    })

    // Clean up very old successful searches (90 days)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const deletedOldSearches = await prisma.search.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo
        }
      }
    })

    // Update last seen for users
    await prisma.user.updateMany({
      where: {
        lastSeenAt: {
          lt: thirtyDaysAgo
        }
      },
      data: {
        lastSeenAt: now
      }
    })

    // Optional: Clean up Redis cache (if needed)
    // This would require implementing a method to scan and delete old keys

    return NextResponse.json({
      success: true,
      deletedSearches: deletedSearches.count,
      deletedOldSearches: deletedOldSearches.count,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
