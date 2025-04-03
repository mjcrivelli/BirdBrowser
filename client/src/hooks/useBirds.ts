import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bird, BirdWithSeenStatus, BirdSighting } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Default user ID until we implement authentication
const DEFAULT_USER_ID = 1;

export function useBirds(userId: number = DEFAULT_USER_ID) {
  const queryClient = useQueryClient();
  
  const {
    data: birds = [],
    isLoading,
    isError,
    error
  } = useQuery<BirdWithSeenStatus[]>({
    queryKey: ['/api/birds', { userId }],
    queryFn: () => fetch(`/api/birds?userId=${userId}`).then(res => res.json()),
  });
  
  const getBirdById = (id: number): BirdWithSeenStatus | undefined => {
    return birds.find((bird) => bird.id === id);
  };
  
  const seenBirds = birds.filter(bird => bird.seen);
  const unseenBirds = birds.filter(bird => !bird.seen);
  
  return {
    birds,
    seenBirds,
    unseenBirds,
    isLoading,
    isError,
    error,
    getBirdById
  };
}

export function useBirdDetail(id: number) {
  return useQuery<Bird>({
    queryKey: ['/api/birds', id],
    enabled: !!id,
  });
}

export function useBirdSightings() {
  const queryClient = useQueryClient();
  const userId = DEFAULT_USER_ID;
  
  // Mark a bird as seen
  const markBirdAsSeen = useMutation({
    mutationFn: async (birdId: number) => {
      console.log(`Sending POST request to /api/sightings with: userId=${userId}, birdId=${birdId}`);
      try {
        // Direct fetch to avoid double-reading body error
        const response = await fetch('/api/sightings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, birdId }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('POST response:', result);
        return result;
      } catch (error) {
        console.error('POST request failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the birds query to refresh the list with updated seen status
      console.log('Successfully marked bird as seen, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/birds'] });
      // Also invalidate specific queries with userId
      queryClient.invalidateQueries({ queryKey: ['/api/birds', { userId }] });
    },
    onError: (error) => {
      console.error('Error in markBirdAsSeen mutation:', error);
    }
  });
  
  // Mark a bird as unseen (remove from seen list)
  const markBirdAsUnseen = useMutation({
    mutationFn: async (birdId: number) => {
      console.log(`Sending DELETE request to /api/sightings/${userId}/${birdId}`);
      try {
        // Direct fetch to avoid double-reading body error
        const response = await fetch(`/api/sightings/${userId}/${birdId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('DELETE response:', result);
        return result;
      } catch (error) {
        console.error('DELETE request failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the birds query to refresh the list with updated seen status
      console.log('Successfully marked bird as unseen, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/birds'] });
      // Also invalidate specific queries with userId
      queryClient.invalidateQueries({ queryKey: ['/api/birds', { userId }] });
    },
    onError: (error) => {
      console.error('Error in markBirdAsUnseen mutation:', error);
    }
  });
  
  // Toggle seen status
  const toggleBirdSeenStatus = (bird: BirdWithSeenStatus) => {
    console.log('Toggling bird seen status:', bird.id, bird.name, bird.seen);
    if (bird.seen) {
      console.log('Marking bird as unseen:', bird.id);
      markBirdAsUnseen.mutate(bird.id);
    } else {
      console.log('Marking bird as seen:', bird.id);
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
