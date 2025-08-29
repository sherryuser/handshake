import { useMutation, useQuery } from '@tanstack/react-query'
import { SearchRequest, SearchResponse, ProPlayer } from '@/types'

interface UseHandshakeSearchOptions {
  onSuccess?: (data: SearchResponse) => void
  onError?: (error: Error) => void
}

export function useHandshakeSearch(options?: UseHandshakeSearchOptions) {
  return useMutation({
    mutationFn: async (request: SearchRequest): Promise<SearchResponse> => {
      const response = await fetch('/api/handshake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      return data
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}

export function useProPlayers() {
  return useQuery({
    queryKey: ['pro-players'],
    queryFn: async (): Promise<ProPlayer[]> => {
      const response = await fetch('/api/pros')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pro players')
      }

      return data.pros || []
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

export function useUserProfiles(steamIds: string[]) {
  return useQuery({
    queryKey: ['user-profiles', steamIds],
    queryFn: async () => {
      if (steamIds.length === 0) return []

      const response = await fetch(`/api/profile?ids=${steamIds.join(',')}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user profiles')
      }

      return data.users || []
    },
    enabled: steamIds.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}
