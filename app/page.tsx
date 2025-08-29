'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gamepad2 as Steam, Github, ExternalLink, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchBar } from '@/components/SearchBar'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { SearchResponse } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const [steamUser, setSteamUser] = useState<any>(null)

  // Load Steam user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('steamUser')
    if (storedUser) {
      setSteamUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('steamUser')
    setSteamUser(null)
  }

  const handleSearch = async (target: string) => {
    // Require login to use handshake feature
    if (!steamUser) {
      alert('Please log in with Steam to use the handshake feature!')
      return
    }

    setIsSearching(true)
    setSearchResult(null)

    try {
      const response = await fetch('/api/handshake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: steamUser.steamid,
          target: target,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Search failed')
      }

      setSearchResult(result)
      
      // Navigate to results page after a short delay to show the result
      setTimeout(() => {
        router.push(`/result?source=${steamUser.steamid}&target=${target}`)
      }, 1500)

    } catch (error) {
      console.error('Search error:', error)
      setSearchResult({
        success: false,
        degree: null,
        path: [],
        errorMessage: error instanceof Error ? error.message : 'Search failed',
        searchId: '',
        requesterUser: { steamid: '', personaname: 'You', avatar: '' } as any,
        targetUser: { steamid: target, personaname: 'Target User', avatar: '' } as any,
      })
    } finally {
      setIsSearching(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10" />

      <motion.div
        className="container mx-auto px-4 py-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="text-center mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <Steam className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">Steam Handshakes</span>
            </div>
            
            {/* Steam Login/User Section */}
            {steamUser ? (
              <div className="flex items-center space-x-3">
                <img 
                  src={steamUser.avatar}
                  alt={steamUser.personaname}
                  className="h-8 w-8 rounded-full border border-white/20"
                />
                <span className="text-white text-sm">{steamUser.personaname}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-white/80 hover:text-white"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="glass" 
                  size="sm" 
                  onClick={() => {
                    const returnUrl = encodeURIComponent(`${window.location.origin}/auth/steam/callback`)
                    const steamLoginUrl = `https://steamcommunity.com/openid/login?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.mode=checkid_setup&openid.return_to=${returnUrl}&openid.realm=${encodeURIComponent(window.location.origin)}&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select`
                    window.location.href = steamLoginUrl
                  }}
                >
                  <Steam className="h-4 w-4 mr-2" />
                  Login with Steam
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // Demo login for testing
                    const demoUser = {
                      steamid: '76561198046783516',
                      personaname: 'Demo User',
                      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg'
                    }
                    localStorage.setItem('steamUser', JSON.stringify(demoUser))
                    setSteamUser(demoUser)
                  }}
                  className="text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black"
                >
                  Demo Login
                </Button>
              </div>
            )}
          </div>

          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Theory of Steam Users&apos; Handshakes
          </motion.h1>
          
          <motion.p 
            className="text-xl text-white/80 mb-8 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Find the shortest connection path between you and any Steam user or professional CS2 player.
          </motion.p>
        </motion.header>

        {/* Search Section */}
        <motion.div variants={itemVariants} className="max-w-2xl mx-auto mb-12">
          <SearchBar 
            onSearch={handleSearch}
            isLoading={isSearching}
          />
        </motion.div>

        {/* Loading State */}
        {isSearching && (
          <motion.div 
            variants={itemVariants}
            className="max-w-4xl mx-auto mb-12"
          >
            <SkeletonLoader type="path" />
          </motion.div>
        )}

        {/* Quick Preview Result */}
        {searchResult && !isSearching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <Card className="glass-card border-white/20">
              <CardContent className="p-6 text-center">
                {searchResult.success ? (
                  <div className="space-y-4">
                    <div className="text-green-400 text-lg font-semibold">
                      ✓ Connection Found!
                    </div>
                    <p className="text-white">
                      You know <span className="font-bold text-blue-400">{searchResult.targetUser.personaname}</span> through{' '}
                      <span className="font-bold text-green-400">{searchResult.degree}</span> handshake{searchResult.degree === 1 ? '' : 's'}
                    </p>
                    <p className="text-white/60 text-sm">
                      Redirecting to full results...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-red-400 text-lg font-semibold">
                      ✗ No Connection Found
                    </div>
                    <p className="text-white">
                      {searchResult.errorMessage || 'Unable to find a connection path'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}



        {/* Login Status Notice */}
        <motion.div variants={itemVariants} className="text-center">
          <Card className={`glass-card max-w-2xl mx-auto ${steamUser ? 'border-green-500/20' : 'border-yellow-500/20'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <div className={`h-2 w-2 rounded-full animate-pulse ${steamUser ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className={`font-semibold ${steamUser ? 'text-green-400' : 'text-yellow-400'}`}>
                  {steamUser ? 'Logged In' : 'Demo Mode'}
                </span>
              </div>
              <p className="text-white/80 text-sm">
                {steamUser ? (
                  <>
                    You&apos;re logged in as <span className="font-medium text-blue-400">{steamUser.personaname}</span>. 
                    Searches will use your Steam account to find connections.
                  </>
                ) : (
                  <>
                    Log in with your Steam account to search from your profile. 
                    Currently using a demo Steam user for searches.
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>


      </motion.div>
    </div>
  )
}
