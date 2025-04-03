import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bird, BirdWithSeenStatus, BirdSighting } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Default user ID until we implement authentication
const DEFAULT_USER_ID = 1;

// Type for API responses
interface MarkBirdResponse {
  sighting: BirdSighting;
  birds: BirdWithSeenStatus[];
}

interface RemoveBirdResponse {
  success: boolean;
  birds: BirdWithSeenStatus[];
}

/**
 * Hook for accessing and managing bird data
 */
export function useBirds(userId: number = DEFAULT_USER_ID) {
  const queryClient = useQueryClient();
  
  // Get all birds with their seen status
  const {
    data: birds = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<BirdWithSeenStatus[]>({
    queryKey: ['/api/birds', { userId }],
    queryFn: () => fetch(`/api/birds?userId=${userId}`).then(res => res.json()),
  });
  
  // Helper function to get a specific bird by ID
  const getBirdById = (id: number): BirdWithSeenStatus | undefined => {
    return birds.find((bird) => bird.id === id);
  };
  
  // Filter birds by seen status
  const seenBirds = birds.filter(bird => bird.seen);
  const unseenBirds = birds.filter(bird => !bird.seen);
  
  return {
    birds,
    seenBirds,
    unseenBirds,
    isLoading,
    isError,
    error,
    refetch,
    getBirdById
  };
}

/**
 * Hook for fetching details of a specific bird
 */
export function useBirdDetail(id: number) {
  return useQuery<Bird>({
    queryKey: ['/api/birds', id],
    enabled: !!id,
  });
}

/**
 * Hook for managing bird sightings (marking birds as seen/unseen)
 */
export function useBirdSightings() {
  const queryClient = useQueryClient();
  const userId = DEFAULT_USER_ID;
  
  // Mark a bird as seen
  const markBirdAsSeen = useMutation<MarkBirdResponse, Error, number>({
    mutationFn: async (birdId: number) => {
      console.log(`Marking bird as seen: ${birdId}`);
      const response = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, birdId }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark bird as seen: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Successfully marked bird as seen:', data);
      
      // Update the query cache directly with the new data
      queryClient.setQueryData(
        ['/api/birds', { userId }], 
        data.birds
      );
    },
    onError: (error) => {
      console.error('Failed to mark bird as seen:', error);
    }
  });
  
  // Mark a bird as unseen
  const markBirdAsUnseen = useMutation<RemoveBirdResponse, Error, number>({
    mutationFn: async (birdId: number) => {
      console.log(`Marking bird as unseen: ${birdId}`);
      const response = await fetch(`/api/sightings/${userId}/${birdId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark bird as unseen: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Successfully marked bird as unseen:', data);
      
      // Update the query cache directly with the new data
      queryClient.setQueryData(
        ['/api/birds', { userId }], 
        data.birds
      );
    },
    onError: (error) => {
      console.error('Failed to mark bird as unseen:', error);
    }
  });
  
  // Toggle the seen status of a bird
  const toggleBirdSeenStatus = (bird: BirdWithSeenStatus) => {
    console.log(`Toggling seen status for bird: ${bird.id}, current status: ${bird.seen}`);
    
    if (bird.seen) {
      markBirdAsUnseen.mutate(bird.id);
    } else {
      markBirdAsSeen.mutate(bird.id);
    }
  };
  
  return {
    markBirdAsSeen,
    markBirdAsUnseen,
    toggleBirdSeenStatus,
    isPending: markBirdAsSeen.isPending || markBirdAsUnseen.isPending
  };
}
