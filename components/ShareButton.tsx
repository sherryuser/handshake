'use client'

import React, { useState } from 'react'
import { Share2, Copy, Check, Twitter, Facebook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { SearchResponse } from '@/types'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  result: SearchResponse
  className?: string
}

export function ShareButton({ result, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/result/${result.searchId}`
  const shareText = result.success 
    ? `I found a connection to ${result.targetUser.personaname} through ${result.degree} handshake${result.degree === 1 ? '' : 's'} on Steam!`
    : `I searched for a connection to ${result.targetUser.personaname} on Steam`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(facebookUrl, '_blank', 'noopener,noreferrer')
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Steam Handshakes',
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="glass" 
          size="lg" 
          className={cn("", className)}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Result
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Share Your Result</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview Card */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Steam Handshakes</h3>
                <p className="text-sm text-white/80">{shareText}</p>
                <div className="flex items-center space-x-2 pt-2">
                  <img 
                    src={result.requesterUser.avatar} 
                    alt="Your avatar" 
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-xs text-white/60">→</span>
                  <img 
                    src={result.targetUser.avatar} 
                    alt="Target avatar" 
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-xs text-blue-400 ml-2">
                    {result.success ? `${result.degree} degree${result.degree === 1 ? '' : 's'}` : 'No connection'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Share Link</label>
            <div className="flex space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="bg-white/5 border-white/20 text-white"
              />
              <Button 
                onClick={copyToClipboard}
                variant="glass"
                size="icon"
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Share On</label>
            <div className="flex space-x-2">
              <Button
                onClick={shareOnTwitter}
                variant="glass"
                size="sm"
                className="flex-1"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={shareOnFacebook}
                variant="glass"
                size="sm"
                className="flex-1"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
          </div>

          {/* Native Share (if supported) */}
          {typeof window !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={shareNative}
              variant="glass"
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}

          {copied && (
            <div className="text-center">
              <p className="text-sm text-green-400">Link copied to clipboard!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
