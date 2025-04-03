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
    mutationFn: (birdId: number) => 
      apiRequest('/api/sightings', 'POST', { userId, birdId }),
    onSuccess: () => {
      // Invalidate the birds query to refresh the list with updated seen status
      queryClient.invalidateQueries({ queryKey: ['/api/birds'] });
    }
  });
  
  // Mark a bird as unseen (remove from seen list)
  const markBirdAsUnseen = useMutation({
    mutationFn: (birdId: number) => 
      apiRequest('/api/sightings', 'DELETE', { userId, birdId }),
    onSuccess: () => {
      // Invalidate the birds query to refresh the list with updated seen status
      queryClient.invalidateQueries({ queryKey: ['/api/birds'] });
    }
  });
  
  // Toggle seen status
  const toggleBirdSeenStatus = (bird: BirdWithSeenStatus) => {
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
