import { useState } from "react";
import { Bird } from "@shared/schema";
import { CheckIcon } from "lucide-react";

interface BirdGridProps {
  birds: Bird[];
  selectedBirds: Set<number>;
  onToggleSelection: (id: number) => void;
  onShowDetails: (bird: Bird) => void;
}

export function BirdGrid({
  birds,
  selectedBirds,
  onToggleSelection,
  onShowDetails,
}: BirdGridProps) {
  return (
    <div className="w-full lg:w-3/4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
      {birds.map((bird) => (
        <BirdCard
          key={bird.id}
          bird={bird}
          isSelected={selectedBirds.has(bird.id)}
          onToggleSelection={() => onToggleSelection(bird.id)}
          onShowDetails={() => onShowDetails(bird)}
        />
      ))}
    </div>
  );
}

interface BirdCardProps {
  bird: Bird;
  isSelected: boolean;
  onToggleSelection: () => void;
  onShowDetails: () => void;
}

function BirdCard({
  bird,
  isSelected,
  onToggleSelection,
  onShowDetails,
}: BirdCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.checkbox-container')) {
      onToggleSelection();
    } else {
      onShowDetails();
    }
  };

  const fallbackImage = "https://via.placeholder.com/300x300?text=No+Image";

  return (
    <div
      className={`bird-card rounded-lg bg-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:translate-y-[-2px] transition-all ${
        isSelected ? "border-[#D0502B] border-2" : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="relative">
        <img
          src={imageError ? fallbackImage : (bird.imageUrl || fallbackImage)}
          alt={bird.name}
          className="bird-image w-full aspect-square object-cover"
          onError={() => setImageError(true)}
        />
        <div className="checkbox-container absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-white shadow">
          <div
            className={`w-4 h-4 rounded-sm border-2 border-[#3B8070] ${
              isSelected ? "bg-[#3B8070]" : ""
            }`}
          >
            {isSelected && (
              <CheckIcon className="text-white" size={14} />
            )}
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-[#333333] truncate">{bird.name}</h3>
        <p className="text-sm text-[#777777] italic">{bird.scientificName}</p>
      </div>
    </div>
  );
}
