'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Eye, AlertCircle, Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PathVisualizer } from '@/components/PathVisualizer'
import { ShareButton } from '@/components/ShareButton'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { SearchResponse } from '@/types'

export default function ResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const source = searchParams.get('source')
  const target = searchParams.get('target')

  useEffect(() => {
    if (source && target) {
      performSearch()
    } else {
      setError('Missing search parameters')
      setLoading(false)
    }
  }, [source, target])

  const performSearch = async () => {
    if (!source || !target) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/handshake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          target,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setResult(data)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatSearchTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`
    }
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <SkeletonLoader type="card" />
            <SkeletonLoader type="path" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Search Error</h2>
                <p className="text-white/80 mb-6">{error}</p>
                <div className="flex space-x-4 justify-center">
                  <Button onClick={() => router.push('/')} variant="glass">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                  <Button onClick={performSearch} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return null
  }

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
          <Button 
            onClick={() => router.push('/')}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>

          {result.success && (
            <ShareButton result={result} />
          )}
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
                  <img 
                    src={result.requesterUser.avatar}
                    alt={result.requesterUser.personaname}
                    className="h-16 w-16 rounded-full border-2 border-blue-400"
                  />
                  <div className="flex flex-col items-center">
                    <div className="text-white/60 text-sm">searched for</div>
                    <ArrowLeft className="h-6 w-6 text-white/40 rotate-180" />
                  </div>
                  <img 
                    src={result.targetUser.avatar}
                    alt={result.targetUser.personaname}
                    className="h-16 w-16 rounded-full border-2 border-green-400"
                  />
                </div>

                {result.success ? (
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      You know <span className="text-blue-400">{result.targetUser.personaname}</span> through{' '}
                      <span className="text-green-400">{result.degree}</span> handshake{result.degree === 1 ? '' : 's'}
                    </h1>
                    <p className="text-white/60">
                      Connection found in {result.stats ? formatSearchTime(result.stats.searchTime) : 'unknown time'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      No connection found to <span className="text-red-400">{result.targetUser.personaname}</span>
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
                  <CardTitle className="text-white text-center">Connection Path</CardTitle>
                </CardHeader>
                <CardContent>
                  <PathVisualizer path={result.path} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Statistics */}
          {result.stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <Card className="glass-card border-white/10">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white">
                    {formatSearchTime(result.stats.searchTime)}
                  </div>
                  <div className="text-white/60 text-sm">Search Time</div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6 text-center">
                  <Eye className="h-8 w-8 text-green-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white">
                    {result.stats.nodesExplored.toLocaleString()}
                  </div>
                  <div className="text-white/60 text-sm">Profiles Explored</div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardContent className="p-6 text-center">
                  <div className="h-8 w-8 text-purple-400 mx-auto mb-3 flex items-center justify-center text-lg font-bold">
                    ⚡
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {result.stats.cacheHits}
                  </div>
                  <div className="text-white/60 text-sm">Cache Hits</div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Search Again */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button 
              onClick={() => router.push('/')}
              variant="glass"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Search Again
            </Button>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-white/60 text-sm"
          >
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
