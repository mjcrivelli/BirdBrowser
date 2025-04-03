import { Bird } from "@shared/schema";
import { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SelectedBirdsPanelProps {
  selectedBirds: Bird[];
  totalBirds: number;
  onRemoveBird: (id: number) => void;
  onClearSelection: () => void;
  onViewDetails: (bird: Bird) => void;
}

export function SelectedBirdsPanel({
  selectedBirds,
  totalBirds,
  onRemoveBird,
  onClearSelection,
  onViewDetails,
}: SelectedBirdsPanelProps) {
  return (
    <div className="w-full lg:w-1/4">
      <div className="sticky top-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#3B8070]">Selected Birds</h2>
        
        <div className="mb-6">
          <span className="text-3xl font-bold text-[#333333]">{selectedBirds.length}</span>
          <span className="text-[#777777]"> of {totalBirds} birds selected</span>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {selectedBirds.map((bird) => (
              <SelectedBirdItem
                key={bird.id}
                bird={bird}
                onRemove={() => onRemoveBird(bird.id)}
                onViewDetails={() => onViewDetails(bird)}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="mt-6 pt-4 border-t border-[#EEEEEE] space-y-3">
          <Button 
            onClick={() => onViewDetails(selectedBirds[0])}
            disabled={selectedBirds.length === 0}
            className="w-full bg-[#3B8070] hover:bg-opacity-90 text-white"
          >
            View Details
          </Button>
          <Button 
            onClick={onClearSelection}
            disabled={selectedBirds.length === 0}
            variant="outline"
            className="w-full border-[#EEEEEE] text-[#333333] hover:bg-[#EEEEEE]"
          >
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SelectedBirdItemProps {
  bird: Bird;
  onRemove: () => void;
  onViewDetails: () => void;
}

function SelectedBirdItem({ bird, onRemove, onViewDetails }: SelectedBirdItemProps) {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = "https://via.placeholder.com/80x80?text=No+Image";

  const handleClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button')) {
      onViewDetails();
    }
  };

  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-md hover:bg-[#EEEEEE] cursor-pointer"
      onClick={handleClick}
    >
      <img
        src={imageError ? fallbackImage : (bird.imageUrl || fallbackImage)}
        alt={bird.name}
        className="w-14 h-14 rounded-md object-cover"
        onError={() => setImageError(true)}
      />
      <div className="flex-grow">
        <h3 className="font-medium">{bird.name}</h3>
        <p className="text-sm text-[#777777] italic">{bird.scientificName}</p>
      </div>
      <button 
        className="text-[#777777] hover:text-[#D0502B] p-1"
        onClick={onRemove}
        aria-label="Remove bird"
      >
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
