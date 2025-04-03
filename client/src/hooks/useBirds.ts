import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Bird } from "@shared/schema";

export function useBirds() {
  const queryClient = useQueryClient();
  
  const {
    data: birds = [],
    isLoading,
    isError,
    error
  } = useQuery<Bird[]>({
    queryKey: ['/api/birds'],
  });
  
  const getBirdById = (id: number): Bird | undefined => {
    return birds.find((bird) => bird.id === id);
  };
  
  return {
    birds,
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
