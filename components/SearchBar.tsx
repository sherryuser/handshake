'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [proSearchInput, setProSearchInput] = useState('')
  const [selectedPro, setSelectedPro] = useState<ProPlayer | null>(null)
  const [filteredPros, setFilteredPros] = useState<ProPlayer[]>([])
  const [allPros, setAllPros] = useState<ProPlayer[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingPros, setLoadingPros] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch pros when switching to pro search mode
  useEffect(() => {
    if (searchType === 'pro' && allPros.length === 0) {
      fetchPros()
    }
  }, [searchType, allPros.length])

  // Filter pros based on search input
  useEffect(() => {
    if (proSearchInput.trim() === '') {
      setFilteredPros([])
      setShowDropdown(false)
      return
    }

    const filtered = allPros.filter(pro =>
      pro.handle.toLowerCase().includes(proSearchInput.toLowerCase()) ||
      pro.team?.toLowerCase().includes(proSearchInput.toLowerCase()) ||
      pro.aliases.some(alias => alias.toLowerCase().includes(proSearchInput.toLowerCase()))
    ).slice(0, 10) // Limit to 10 results

    setFilteredPros(filtered)
    setShowDropdown(filtered.length > 0)
  }, [proSearchInput, allPros])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchPros = async () => {
    setLoadingPros(true)
    try {
      const response = await fetch('/api/pros')
      const data = await response.json()
      setAllPros(data.pros || [])
    } catch (error) {
      console.error('Error fetching pros:', error)
    } finally {
      setLoadingPros(false)
    }
  }

  const handleSelectPro = (pro: ProPlayer) => {
    setSelectedPro(pro)
    setProSearchInput(pro.handle)
    setShowDropdown(false)
  }

  const clearProSelection = () => {
    setSelectedPro(null)
    setProSearchInput('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let target = ''
    if (searchType === 'manual') {
      target = manualInput.trim()
    } else if (selectedPro) {
      target = selectedPro.id64
    }
    
    if (!target) return
    onSearch(target)
  }

  const isValidInput = () => {
    if (searchType === 'manual') {
      return manualInput.trim().length > 0
    }
    return selectedPro !== null
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

          {/* Pro Player Search */}
          {searchType === 'pro' && (
            <div className="space-y-2 relative" ref={dropdownRef}>
              <div className="relative">
                <Input
                  ref={inputRef}
                  placeholder={loadingPros ? "Loading pros..." : "Search for professional players..."}
                  value={proSearchInput}
                  onChange={(e) => {
                    setProSearchInput(e.target.value)
                    if (selectedPro) {
                      setSelectedPro(null) // Clear selection when typing
                    }
                  }}
                  onFocus={() => {
                    if (filteredPros.length > 0) {
                      setShowDropdown(true)
                    }
                  }}
                  disabled={loadingPros}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/60 pr-10"
                />
                {selectedPro && (
                  <button
                    type="button"
                    onClick={clearProSelection}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown Results */}
              {showDropdown && filteredPros.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredPros.map((pro) => (
                    <button
                      key={pro.id64}
                      type="button"
                      onClick={() => handleSelectPro(pro)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{pro.handle}</div>
                          {pro.team && (
                            <div className="text-sm text-white/60">{pro.team}</div>
                          )}
                        </div>
                        {pro.aliases.length > 1 && (
                          <div className="text-xs text-white/40">
                            +{pro.aliases.length - 1} alias{pro.aliases.length > 2 ? 'es' : ''}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedPro && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-medium">{selectedPro.handle}</span>
                    {selectedPro.team && (
                      <span className="text-green-400/80">({selectedPro.team})</span>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-white/60">
                Type to search for professional CS2 players in real-time
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
