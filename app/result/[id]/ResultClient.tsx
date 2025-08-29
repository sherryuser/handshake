'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, Share2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PathVisualizer } from '@/components/PathVisualizer'
import { ShareButton } from '@/components/ShareButton'
import { SearchResponse } from '@/types'

interface ResultClientProps {
  result: SearchResponse
  isShared?: boolean
}

export default function ResultClient({ result, isShared = false }: ResultClientProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push('/')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>

            {isShared && (
              <div className="flex items-center space-x-2 text-blue-400 text-sm">
                <Share2 className="h-4 w-4" />
                <span>Shared Result</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {result.success && (
              <ShareButton result={result} />
            )}
            <Button 
              onClick={() => router.push('/')}
              variant="glass"
              size="sm"
            >
              <Home className="h-4 w-4 mr-2" />
              New Search
            </Button>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Result Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-white/20">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className="flex flex-col items-center space-y-2">
                    <img 
                      src={result.requesterUser.avatar}
                      alt={result.requesterUser.personaname}
                      className="h-16 w-16 rounded-full border-2 border-blue-400"
                    />
                    <div className="text-sm text-white/80 text-center">
                      {result.requesterUser.personaname}
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    <ArrowLeft className="h-8 w-8 text-white/40 rotate-180" />
                    <div className="text-xs text-white/60">searched for</div>
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    <img 
                      src={result.targetUser.avatar}
                      alt={result.targetUser.personaname}
                      className="h-16 w-16 rounded-full border-2 border-green-400"
                    />
                    <div className="text-sm text-white/80 text-center">
                      {result.targetUser.personaname}
                    </div>
                  </div>
                </div>

                {result.success ? (
                  <div className="space-y-4">
                    <h1 className="text-2xl md:text-4xl font-bold text-white">
                      Connected through{' '}
                      <span className="text-green-400">{result.degree}</span> handshake{result.degree === 1 ? '' : 's'}
                    </h1>
                    <p className="text-white/60">
                      Steam users are more connected than you think!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h1 className="text-2xl md:text-4xl font-bold text-white">
                      No connection found
                    </h1>
                    <p className="text-white/60">
                      {result.errorMessage || 'No path exists within the search depth limit'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Path Visualization */}
          {result.success && result.path && result.path.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-center flex items-center justify-center space-x-2">
                    <span>Connection Path</span>
                    <ExternalLink className="h-4 w-4 text-white/60" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PathVisualizer path={result.path} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card border-blue-500/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Discover Your Own Connections
                </h2>
                <p className="text-white/80 mb-6">
                  Find out how you&apos;re connected to your friends, favorite streamers, or professional players through Steam&apos;s social network.
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  variant="glass"
                  size="lg"
                  className="glass-button"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Try Your Own Search
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* App Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-white/60 text-sm space-y-2"
          >
            <p>
              <strong>Steam Handshakes</strong> - Explore the social graph of Steam users
            </p>
            <p>
              This search was performed using publicly available Steam friend lists.
              Private profiles cannot be searched.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
