import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bird, BirdWithSeenStatus, BirdSighting, SightingRecord } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Default user ID until we implement authentication
const DEFAULT_USER_ID = 1;

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
}

function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>({ latitude: null, longitude: null });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        console.log("Geolocation error:", err.message);
        setError(err.message);
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  return { location, error, isLoading };
}

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

interface MarkBirdWithNameArgs {
  birdId: number;
  birdName: string;
}

/**
 * Hook for managing bird sightings (marking birds as seen/unseen)
 */
export function useBirdSightings() {
  const queryClient = useQueryClient();
  const userId = DEFAULT_USER_ID;
  const { location } = useUserLocation();
  
  // Helper to record sighting with location
  const recordSighting = async (birdId: number, birdName: string) => {
    try {
      const response = await fetch('/api/sighting-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birdId,
          birdName,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to record sighting:', response.status);
      } else {
        console.log('Sighting recorded successfully');
      }
    } catch (error) {
      console.error('Error recording sighting:', error);
    }
  };
  
  // Mark a bird as seen
  const markBirdAsSeen = useMutation<MarkBirdResponse, Error, MarkBirdWithNameArgs>({
    mutationFn: async ({ birdId, birdName }: MarkBirdWithNameArgs) => {
      console.log(`Marking bird as seen: ${birdId}`);
      
      // Record the sighting with location data
      await recordSighting(birdId, birdName);
      
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
    onMutate: async ({ birdId }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/birds', { userId }] });
      
      // Snapshot the previous birds data
      const previousBirds = queryClient.getQueryData<BirdWithSeenStatus[]>(
        ['/api/birds', { userId }]
      );
      
      // Optimistically update the birds cache
      if (previousBirds) {
        const updatedBirds = previousBirds.map(bird => 
          bird.id === birdId ? { ...bird, seen: true } : bird
        );
        
        queryClient.setQueryData(
          ['/api/birds', { userId }], 
          updatedBirds
        );
      }
      
      // Return a context object with the snapshotted value
      return { previousBirds };
    },
    
    onSuccess: (data) => {
      console.log('Successfully marked bird as seen:', data);
      
      // No need to invalidate queries or set data again here
      // as we're handling it on the backend already
    },
    
    onError: (error, { birdId }, context: any) => {
      console.error('Failed to mark bird as seen:', error);
      
      // If the mutation fails, roll back to the previous state
      if (context?.previousBirds) {
        queryClient.setQueryData(
          ['/api/birds', { userId }], 
          context.previousBirds
        );
      }
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
    onMutate: async (birdId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/birds', { userId }] });
      
      // Snapshot the previous birds data
      const previousBirds = queryClient.getQueryData<BirdWithSeenStatus[]>(
        ['/api/birds', { userId }]
      );
      
      // Optimistically update the birds cache
      if (previousBirds) {
        const updatedBirds = previousBirds.map(bird => 
          bird.id === birdId ? { ...bird, seen: false } : bird
        );
        
        queryClient.setQueryData(
          ['/api/birds', { userId }], 
          updatedBirds
        );
      }
      
      // Return a context object with the snapshotted value
      return { previousBirds };
    },
    
    onSuccess: (data) => {
      console.log('Successfully marked bird as unseen:', data);
      
      // No need to invalidate queries or set data again here
      // as we're handling it on the backend already
    },
    
    onError: (error, birdId, context: any) => {
      console.error('Failed to mark bird as unseen:', error);
      
      // If the mutation fails, roll back to the previous state
      if (context?.previousBirds) {
        queryClient.setQueryData(
          ['/api/birds', { userId }], 
          context.previousBirds
        );
      }
    }
  });
  
  // Toggle the seen status of a bird
  const toggleBirdSeenStatus = (bird: BirdWithSeenStatus) => {
    console.log(`Toggling seen status for bird: ${bird.id}, current status: ${bird.seen}`);
    
    if (bird.seen) {
      markBirdAsUnseen.mutate(bird.id);
    } else {
      markBirdAsSeen.mutate({ birdId: bird.id, birdName: bird.name });
    }
  };
  
  return {
    markBirdAsSeen,
    markBirdAsUnseen,
    toggleBirdSeenStatus,
    isPending: markBirdAsSeen.isPending || markBirdAsUnseen.isPending
  };
}
