import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BirdGrid } from "@/components/bird-grid";
import { BirdList } from "@/components/bird-list";
import { SelectedBirdsPanel } from "@/components/selected-birds-panel";
import { BirdDetailModal } from "@/components/bird-detail-modal";
import { useBirds, BirdFilter } from "@/hooks/use-birds";
import { Bird } from "@shared/schema";
import { SearchIcon } from "lucide-react";

export default function Home() {
  const {
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
    isLoading,
    viewMode,
    setViewMode
  } = useBirds();

  const [detailBird, setDetailBird] = useState<Bird | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleShowDetails = (bird: Bird) => {
    setDetailBird(bird);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  const handleToggleDetailSelection = () => {
    if (detailBird) {
      toggleBirdSelection(detailBird.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#3B8070]">
            Toca Bird Selection
          </h1>
          <Button 
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="bg-[#3B8070] text-white hover:bg-opacity-90"
          >
            {viewMode === "grid" ? "List View" : "Grid View"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-grow max-w-md">
            <Input
              type="text"
              placeholder="Search birds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#EEEEEE] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B8070]"
            />
            <SearchIcon className="h-5 w-5 absolute right-3 top-2.5 text-[#777777]" />
          </div>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as BirdFilter)}
          >
            <SelectTrigger
              className="px-4 py-2 border border-[#EEEEEE] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B8070]"
            >
              <SelectValue placeholder="All Birds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Birds</SelectItem>
              <SelectItem value="common">Common Birds</SelectItem>
              <SelectItem value="rare">Rare Birds</SelectItem>
              <SelectItem value="endangered">Endangered</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[#777777]">
            <span id="birdCount">{filteredBirds.length}</span> birds found
          </p>
          <Button
            onClick={toggleSelectAll}
            variant="link"
            className="text-[#3B8070] hover:underline"
          >
            {selectedBirds.size === filteredBirds.length && filteredBirds.length > 0
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Bird List/Grid */}
        {viewMode === "grid" ? (
          <BirdGrid
            birds={filteredBirds}
            selectedBirds={selectedBirds}
            onToggleSelection={toggleBirdSelection}
            onShowDetails={handleShowDetails}
          />
        ) : (
          <BirdList
            birds={filteredBirds}
            selectedBirds={selectedBirds}
            onToggleSelection={toggleBirdSelection}
            onShowDetails={handleShowDetails}
            onSelectAll={toggleSelectAll}
          />
        )}

        {/* Selected Birds Panel */}
        <SelectedBirdsPanel
          selectedBirds={selectedBirdObjects}
          totalBirds={filteredBirds.length}
          onRemoveBird={toggleBirdSelection}
          onClearSelection={clearSelection}
          onViewDetails={handleShowDetails}
        />
      </div>

      {/* Bird Detail Modal */}
      <BirdDetailModal
        bird={detailBird}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        isSelected={detailBird ? selectedBirds.has(detailBird.id) : false}
        onToggleSelection={handleToggleDetailSelection}
      />
    </div>
  );
}
