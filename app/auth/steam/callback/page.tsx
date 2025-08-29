'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gamepad2 as Steam, CheckCircle, XCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SteamUser {
  steamid: string
  personaname: string
  avatar: string
}

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [user, setUser] = useState<SteamUser | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get all search params
        const params = new URLSearchParams(searchParams.toString())
        
        // Check if we have the required OpenID parameters
        const openidMode = params.get('openid.mode')
        const openidIdentity = params.get('openid.identity')
        
        if (openidMode !== 'id_res' || !openidIdentity) {
          throw new Error('Invalid Steam OpenID response')
        }

        // Extract Steam ID from the identity URL
        const steamIdMatch = openidIdentity.match(/(\d+)$/)
        if (!steamIdMatch) {
          throw new Error('Could not extract Steam ID from response')
        }

        const steamId = steamIdMatch[1]
        
        // Verify the response with Steam and get user info
        const response = await fetch('/api/auth/steam/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            steamId,
            openidParams: Object.fromEntries(params.entries())
          })
        })

        if (!response.ok) {
          throw new Error('Failed to verify Steam authentication')
        }

        const userData = await response.json()
        
        if (userData.success) {
          setUser(userData.user)
          setStatus('success')
          
          // Store user data in localStorage for demo purposes
          localStorage.setItem('steamUser', JSON.stringify(userData.user))
          
          // Redirect to home page after a delay
          setTimeout(() => {
            router.push('/')
          }, 3000)
        } else {
          throw new Error(userData.error || 'Authentication failed')
        }

      } catch (error) {
        console.error('Steam auth error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setStatus('error')
      }
    }

    processCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-white/20">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Steam className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                Steam Authentication
              </h1>
            </div>

            {status === 'loading' && (
              <div className="space-y-4">
                <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-white/80">Verifying your Steam account...</p>
              </div>
            )}

            {status === 'success' && user && (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                <div className="space-y-2">
                  <p className="text-green-400 font-semibold">Login Successful!</p>
                  <div className="flex items-center justify-center space-x-3">
                    <img 
                      src={user.avatar} 
                      alt={user.personaname}
                      className="h-10 w-10 rounded-full"
                    />
                    <span className="text-white font-medium">{user.personaname}</span>
                  </div>
                  <p className="text-white/60 text-sm">Steam ID: {user.steamid}</p>
                  <p className="text-white/60 text-sm">Redirecting to home page...</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="h-12 w-12 text-red-400 mx-auto" />
                <div className="space-y-2">
                  <p className="text-red-400 font-semibold">Authentication Failed</p>
                  <p className="text-white/80 text-sm">{error}</p>
                  <Button 
                    onClick={() => router.push('/')}
                    variant="glass"
                    className="mt-4"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function SteamCallbackPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CallbackContent />
    </React.Suspense>
  )
}
