import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Static list of professional players for demo purposes
const STATIC_PROS = [
  {
    id64: '76561198010511021',
    handle: 's1mple',
    team: 'NAVI',
    aliases: ['s1mple', 'Aleksandr Kostyliev']
  },
  {
    id64: '76561198034202275',
    handle: 'ZywOo',
    team: 'G2',
    aliases: ['ZywOo', 'Mathieu Herbaut']
  },
  {
    id64: '76561198152179070',
    handle: 'sh1ro',
    team: 'Cloud9',
    aliases: ['sh1ro', 'Dmitry Sokolov']
  },
  {
    id64: '76561198001238303',
    handle: 'device',
    team: 'Astralis',
    aliases: ['device', 'Nicolai Reedtz']
  },
  {
    id64: '76561198044045107',
    handle: 'NiKo',
    team: 'G2',
    aliases: ['NiKo', 'Nikola Kovač']
  },
  {
    id64: '76561198309252969',
    handle: 'donk',
    team: 'Spirit',
    aliases: ['donk', 'Danil Kryshkovets']
  },
  {
    id64: '76561198046783516',
    handle: 'electronic',
    team: 'NAVI',
    aliases: ['electronic', 'Denis Sharipov']
  },
  {
    id64: '76561198121220486',
    handle: 'iM',
    team: 'Spirit',
    aliases: ['iM', 'Viktor Zolotarev']
  },
  {
    id64: '76561198132830618',
    handle: 'Ax1Le',
    team: 'Cloud9',
    aliases: ['Ax1Le', 'Sergey Rykhtorov']
  },
  {
    id64: '76561198044045107',
    handle: 'coldzera',
    team: 'FaZe',
    aliases: ['coldzera', 'Marcelo David']
  }
]

export async function GET() {
  try {
    // Try to get pros from database first
    let pros = await prisma.pro.findMany({
      orderBy: {
        handle: 'asc'
      }
    })

    // If no pros in database, seed with static data
    if (pros.length === 0) {
      try {
        await prisma.pro.createMany({
          data: STATIC_PROS,
          skipDuplicates: true
        })
        
        pros = await prisma.pro.findMany({
          orderBy: {
            handle: 'asc'
          }
        })
      } catch (seedError) {
        console.error('Error seeding pros:', seedError)
        // Return static data if database operations fail
        return NextResponse.json({
          pros: STATIC_PROS,
          count: STATIC_PROS.length,
          source: 'static'
        })
      }
    }

    return NextResponse.json({
      pros,
      count: pros.length,
      source: 'database'
    })

  } catch (error) {
    console.error('Pros API error:', error)
    
    // Fallback to static data
    return NextResponse.json({
      pros: STATIC_PROS,
      count: STATIC_PROS.length,
      source: 'static_fallback'
    })
  }
}
