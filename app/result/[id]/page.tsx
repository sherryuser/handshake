import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SteamAPI } from '@/lib/steam-api'
import { prisma } from '@/lib/prisma'
import { SteamUser, SearchResponse } from '@/types'
import ResultClient from './ResultClient'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    // Parse the search ID format: source_target_timestamp
    const parts = params.id.split('_')
    if (parts.length !== 3) {
      return {
        title: 'Steam Handshakes Result',
        description: 'View this Steam connection result.',
      }
    }

    const [sourceId, targetId] = parts
    
    // Get user information
    const [sourceUser, targetUser] = await Promise.all([
      SteamAPI.getUserSummary(sourceId),
      SteamAPI.getUserSummary(targetId)
    ])

    if (!sourceUser || !targetUser) {
      return {
        title: 'Steam Handshakes Result',
        description: 'View this Steam connection result.',
      }
    }

    // Try to get the search result
    const searchResult = await prisma.search.findFirst({
      where: {
        requesterId: sourceId,
        targetId: targetId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const title = searchResult?.success 
      ? `${sourceUser.personaname} knows ${targetUser.personaname} through ${searchResult.degree} handshake${searchResult.degree === 1 ? '' : 's'}`
      : `${sourceUser.personaname} searched for ${targetUser.personaname} on Steam`

    const description = searchResult?.success
      ? `Discover how ${sourceUser.personaname} and ${targetUser.personaname} are connected through their Steam friend networks.`
      : `${sourceUser.personaname} searched for a connection to ${targetUser.personaname} on Steam.`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: [
          {
            url: `/api/og?source=${sourceId}&target=${targetId}&degree=${searchResult?.degree || 0}&success=${searchResult?.success || false}`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`/api/og?source=${sourceId}&target=${targetId}&degree=${searchResult?.degree || 0}&success=${searchResult?.success || false}`],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Steam Handshakes Result',
      description: 'View this Steam connection result.',
    }
  }
}

export default async function SharedResultPage({ params }: PageProps) {
  try {
    // Parse the search ID format: source_target_timestamp
    const parts = params.id.split('_')
    if (parts.length !== 3) {
      notFound()
    }

    const [sourceId, targetId] = parts

    // Get user information
    const [sourceUser, targetUser] = await Promise.all([
      SteamAPI.getUserSummary(sourceId),
      SteamAPI.getUserSummary(targetId)
    ])

    if (!sourceUser || !targetUser) {
      notFound()
    }

    // Get the most recent search result
    const searchResult = await prisma.search.findFirst({
      where: {
        requesterId: sourceId,
        targetId: targetId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If we have a search result with a path, get user details for the path
    let pathUsers: SteamUser[] = []
    if (searchResult?.success && searchResult.path) {
      try {
        const pathIds = Array.isArray(searchResult.path) 
          ? searchResult.path as string[]
          : []
        
        if (pathIds.length > 0) {
          const allUsers = await SteamAPI.getUserSummaries(pathIds)
          // Maintain order of the path
          pathUsers = pathIds.map(id => 
            allUsers.find(user => user.steamid === id)
          ).filter(Boolean) as SteamUser[]
        }
      } catch (error) {
        console.error('Error parsing path:', error)
      }
    }

    const result: SearchResponse = {
      success: searchResult?.success || false,
      degree: searchResult?.degree || null,
      path: pathUsers,
      errorMessage: searchResult?.errorMessage || undefined,
      searchId: params.id,
      requesterUser: sourceUser,
      targetUser: targetUser,
      stats: {
        searchTime: 0,
        nodesExplored: 0,
        cacheHits: 0,
      }
    }

    return <ResultClient result={result} isShared={true} />
    
  } catch (error) {
    console.error('Error loading shared result:', error)
    notFound()
  }
}
