import { useQuery, useMutation } from "@tanstack/react-query";
import { Bird } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, useMemo } from "react";

export type BirdFilter = "all" | "common" | "rare" | "endangered";

export function useBirds() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<BirdFilter>("all");
  const [selectedBirds, setSelectedBirds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch birds from API
  const birdsQuery = useQuery<Bird[]>({
    queryKey: ["/api/birds"],
  });

  const birds = birdsQuery.data || [];

  // Filter birds based on search term and category
  const filteredBirds = useMemo(() => {
    return birds.filter((bird) => {
      const matchesSearch =
        searchTerm === "" ||
        bird.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bird.scientificName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filter === "all" || (bird.category && bird.category === filter);

      return matchesSearch && matchesFilter;
    });
  }, [birds, searchTerm, filter]);

  // Handle bird selection
  const toggleBirdSelection = (id: number) => {
    setSelectedBirds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select or deselect all birds
  const toggleSelectAll = () => {
    if (selectedBirds.size === filteredBirds.length) {
      // Deselect all
      setSelectedBirds(new Set());
    } else {
      // Select all
      setSelectedBirds(new Set(filteredBirds.map((bird) => bird.id)));
    }
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedBirds(new Set());
  };

  // Get selected bird objects
  const selectedBirdObjects = useMemo(() => {
    return birds.filter((bird) => selectedBirds.has(bird.id));
  }, [birds, selectedBirds]);

  return {
    birds,
    filteredBirds,
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    selectedBirds,
    selectedBirdObjects,
    toggleBirdSelection,
    toggleSelectAll,
    clearSelection,
    isLoading: birdsQuery.isLoading,
    viewMode, 
    setViewMode
  };
}
