'use client'

import React, { useState, useEffect } from 'react'
import { Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ProPlayer } from '@/types'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  onSearch: (target: string) => void
  isLoading?: boolean
  className?: string
}

export function SearchBar({ onSearch, isLoading = false, className }: SearchBarProps) {
  const [searchType, setSearchType] = useState<'manual' | 'pro'>('manual')
  const [manualInput, setManualInput] = useState('')
  const [selectedPro, setSelectedPro] = useState('')
  const [pros, setPros] = useState<ProPlayer[]>([])
  const [loadingPros, setLoadingPros] = useState(false)

  useEffect(() => {
    if (searchType === 'pro') {
      fetchPros()
    }
  }, [searchType])

  const fetchPros = async () => {
    setLoadingPros(true)
    try {
      const response = await fetch('/api/pros')
      const data = await response.json()
      setPros(data.pros || [])
    } catch (error) {
      console.error('Error fetching pros:', error)
    } finally {
      setLoadingPros(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const target = searchType === 'manual' ? manualInput.trim() : selectedPro
    if (!target) return
    
    onSearch(target)
  }

  const isValidInput = () => {
    if (searchType === 'manual') {
      return manualInput.trim().length > 0
    }
    return selectedPro.length > 0
  }

  return (
    <Card className={cn("glass-card", className)}>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Type Toggle */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={searchType === 'manual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSearchType('manual')}
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              Manual Search
            </Button>
            <Button
              type="button"
              variant={searchType === 'pro' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSearchType('pro')}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              Pro Players
            </Button>
          </div>

          {/* Manual Input */}
          {searchType === 'manual' && (
            <div className="space-y-2">
              <Input
                placeholder="Enter Steam ID, username, or profile URL..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/60"
              />
              <p className="text-xs text-white/60">
                Supports SteamID64, vanity URLs, or full Steam profile links
              </p>
            </div>
          )}

          {/* Pro Player Selection */}
          {searchType === 'pro' && (
            <div className="space-y-2">
              <Select 
                value={selectedPro} 
                onValueChange={setSelectedPro}
                disabled={loadingPros}
              >
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue 
                    placeholder={loadingPros ? "Loading pros..." : "Select a professional player"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {pros.map((pro) => (
                    <SelectItem key={pro.id64} value={pro.id64}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{pro.handle}</span>
                        {pro.team && (
                          <span className="text-xs text-muted-foreground">({pro.team})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-white/60">
                Find your connection to professional CS2 players
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValidInput() || isLoading}
            className="w-full glass-button"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find Handshake Path
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
