'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
  type?: 'path' | 'search' | 'card'
}

export function SkeletonLoader({ className, type = 'path' }: SkeletonLoaderProps) {
  if (type === 'path') {
    return (
      <div className={cn("w-full", className)}>
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-center space-x-4 p-6">
          {[...Array(3)].map((_, index) => (
            <React.Fragment key={index}>
              {/* Avatar Skeleton */}
              <div className="flex flex-col items-center space-y-2">
                <div className="h-16 w-16 rounded-full shimmer-bg animate-shimmer border-2 border-white/10" />
                <div className="space-y-1">
                  <div className="h-4 w-16 shimmer-bg animate-shimmer rounded" />
                  <div className="h-3 w-12 shimmer-bg animate-shimmer rounded mx-auto" />
                </div>
              </div>

              {/* Chevron Skeleton */}
              {index < 2 && (
                <div className="h-8 w-8 shimmer-bg animate-shimmer rounded opacity-60" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <div className="flex space-x-4 p-4">
            {[...Array(3)].map((_, index) => (
              <React.Fragment key={index}>
                {/* Avatar Skeleton */}
                <div className="flex-shrink-0 flex flex-col items-center space-y-2">
                  <div className="h-12 w-12 rounded-full shimmer-bg animate-shimmer border-2 border-white/10" />
                  <div className="space-y-1">
                    <div className="h-3 w-12 shimmer-bg animate-shimmer rounded" />
                    <div className="h-2 w-8 shimmer-bg animate-shimmer rounded mx-auto" />
                  </div>
                </div>

                {/* Chevron Skeleton */}
                {index < 2 && (
                  <div className="flex items-center justify-center flex-shrink-0 pt-3">
                    <div className="h-6 w-6 shimmer-bg animate-shimmer rounded opacity-60" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="mt-4 text-center">
          <div className="h-4 w-48 shimmer-bg animate-shimmer rounded mx-auto" />
        </div>
      </div>
    )
  }

  if (type === 'search') {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="p-6 space-y-4">
          {/* Toggle Buttons Skeleton */}
          <div className="flex space-x-2">
            <div className="h-10 flex-1 shimmer-bg animate-shimmer rounded" />
            <div className="h-10 flex-1 shimmer-bg animate-shimmer rounded" />
          </div>

          {/* Input Skeleton */}
          <div className="space-y-2">
            <div className="h-10 w-full shimmer-bg animate-shimmer rounded" />
            <div className="h-4 w-64 shimmer-bg animate-shimmer rounded" />
          </div>

          {/* Button Skeleton */}
          <div className="h-12 w-full shimmer-bg animate-shimmer rounded" />
        </CardContent>
      </Card>
    )
  }

  if (type === 'card') {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-48 shimmer-bg animate-shimmer rounded" />
            <div className="h-4 w-full shimmer-bg animate-shimmer rounded" />
            <div className="h-4 w-3/4 shimmer-bg animate-shimmer rounded" />
          </div>
          <div className="flex space-x-4">
            <div className="h-12 w-12 rounded-full shimmer-bg animate-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 shimmer-bg animate-shimmer rounded" />
              <div className="h-3 w-16 shimmer-bg animate-shimmer rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className={cn(
          "border-2 border-white/30 border-t-white rounded-full animate-spin",
          sizeClasses[size]
        )} 
      />
    </div>
  )
}

interface PulsingDotsProps {
  className?: string
}

export function PulsingDots({ className }: PulsingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="h-2 w-2 bg-white/60 rounded-full animate-pulse"
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}
