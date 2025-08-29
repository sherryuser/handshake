import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { SteamAPI } from '@/lib/steam-api'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const target = searchParams.get('target')
    const degree = searchParams.get('degree')
    const success = searchParams.get('success') === 'true'

    if (!source || !target) {
      return new Response('Missing parameters', { status: 400 })
    }

    // Get user information
    const [sourceUser, targetUser] = await Promise.all([
      SteamAPI.getUserSummary(source),
      SteamAPI.getUserSummary(target)
    ])

    if (!sourceUser || !targetUser) {
      return new Response('Users not found', { status: 404 })
    }

    const title = success 
      ? `${sourceUser.personaname} knows ${targetUser.personaname} through ${degree} handshake${degree === '1' ? '' : 's'}`
      : `${sourceUser.personaname} searched for ${targetUser.personaname}`

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            color: 'white',
            fontFamily: 'system-ui',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#60a5fa',
              }}
            >
              Steam Handshakes
            </div>
          </div>

          {/* User Avatars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '60px',
              marginBottom: '40px',
            }}
          >
            {/* Source User */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <img
                src={sourceUser.avatarfull || sourceUser.avatar}
                alt={sourceUser.personaname}
                width={120}
                height={120}
                style={{
                  borderRadius: '50%',
                  border: '4px solid #60a5fa',
                }}
              />
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  textAlign: 'center',
                  maxWidth: '200px',
                }}
              >
                {sourceUser.personaname}
              </div>
            </div>

            {/* Connection Indicator */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '40px',
                  color: success ? '#10b981' : '#ef4444',
                }}
              >
                {success ? '🤝' : '❌'}
              </div>
              {success && (
                <div
                  style={{
                    fontSize: '18px',
                    color: '#10b981',
                    fontWeight: '600',
                  }}
                >
                  {degree} degree{degree === '1' ? '' : 's'}
                </div>
              )}
            </div>

            {/* Target User */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <img
                src={targetUser.avatarfull || targetUser.avatar}
                alt={targetUser.personaname}
                width={120}
                height={120}
                style={{
                  borderRadius: '50%',
                  border: '4px solid #10b981',
                }}
              />
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  textAlign: 'center',
                  maxWidth: '200px',
                }}
              >
                {targetUser.personaname}
              </div>
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '900px',
              lineHeight: 1.2,
              marginBottom: '20px',
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '18px',
              color: '#94a3b8',
              textAlign: 'center',
            }}
          >
            Discover connections through Steam's social network
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '16px',
              color: '#64748b',
            }}
          >
            steamhandshakes.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Error generating image', { status: 500 })
  }
}
