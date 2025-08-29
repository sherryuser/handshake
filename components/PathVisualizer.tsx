'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SteamUser } from '@/types'
import { cn } from '@/lib/utils'

interface PathVisualizerProps {
  path: SteamUser[]
  className?: string
  showSteamLinks?: boolean
}

export function PathVisualizer({ path, className, showSteamLinks = true }: PathVisualizerProps) {
  if (path.length === 0) {
    return null
  }

  const openSteamProfile = (user: SteamUser) => {
    if (showSteamLinks) {
      window.open(user.profileurl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-center space-x-4 p-6">
        {path.map((user, index) => (
          <React.Fragment key={user.steamid}>
            {/* User Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2 }}
              className="flex flex-col items-center space-y-2"
            >
              <div
                className={cn(
                  "relative group cursor-pointer",
                  showSteamLinks && "hover:scale-105 transition-transform"
                )}
                onClick={() => openSteamProfile(user)}
              >
                <Avatar className="h-16 w-16 border-2 border-white/20 hover:border-blue-400/50 transition-colors">
                  <AvatarImage src={user.avatarfull || user.avatar} alt={user.personaname} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {user.personaname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {showSteamLinks && (
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-blue-500 rounded-full p-1">
                      <ExternalLink className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white truncate max-w-[80px]">
                  {user.personaname}
                </p>
                {index === 0 && (
                  <p className="text-xs text-blue-400">You</p>
                )}
                {index === path.length - 1 && (
                  <p className="text-xs text-green-400">Target</p>
                )}
              </div>
            </motion.div>

            {/* Chevron Separator */}
            {index < path.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 + 0.1 }}
                className="flex items-center"
              >
                <ChevronRight className="h-8 w-8 text-white/60 animate-pulse-glow" />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex overflow-x-auto pb-4 space-x-4 p-4">
          {path.map((user, index) => (
            <React.Fragment key={user.steamid}>
              {/* User Avatar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15 }}
                className="flex-shrink-0 flex flex-col items-center space-y-2"
              >
                <div
                  className={cn(
                    "relative group cursor-pointer",
                    showSteamLinks && "active:scale-95 transition-transform"
                  )}
                  onClick={() => openSteamProfile(user)}
                >
                  <Avatar className="h-12 w-12 border-2 border-white/20">
                    <AvatarImage src={user.avatar} alt={user.personaname} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {user.personaname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {showSteamLinks && (
                    <div className="absolute -top-1 -right-1">
                      <div className="bg-blue-500 rounded-full p-0.5">
                        <ExternalLink className="h-2 w-2 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-white truncate max-w-[60px]">
                    {user.personaname}
                  </p>
                  {index === 0 && (
                    <p className="text-xs text-blue-400">You</p>
                  )}
                  {index === path.length - 1 && (
                    <p className="text-xs text-green-400">Target</p>
                  )}
                </div>
              </motion.div>

              {/* Chevron Separator */}
              {index < path.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.1 }}
                  className="flex items-center justify-center flex-shrink-0 pt-3"
                >
                  <ChevronRight className="h-6 w-6 text-white/60" />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Path Statistics */}
      <div className="mt-4 text-center">
        <p className="text-sm text-white/80">
          Connection found through <span className="font-bold text-blue-400">{path.length - 1}</span> handshake{path.length === 2 ? '' : 's'}
        </p>
      </div>
    </div>
  )
}
