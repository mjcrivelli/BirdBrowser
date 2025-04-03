import { useState } from "react";
import { Bird } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

interface BirdListProps {
  birds: Bird[];
  selectedBirds: Set<number>;
  onToggleSelection: (id: number) => void;
  onShowDetails: (bird: Bird) => void;
  onSelectAll: () => void;
}

export function BirdList({
  birds,
  selectedBirds,
  onToggleSelection,
  onShowDetails,
  onSelectAll,
}: BirdListProps) {
  const allSelected = birds.length > 0 && selectedBirds.size === birds.length;

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-[#EEEEEE]">
          <thead className="bg-[#EEEEEE]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#777777] uppercase tracking-wider">
                <div className="flex items-center">
                  <Checkbox 
                    id="selectAll"
                    checked={allSelected}
                    onCheckedChange={onSelectAll}
                    className="mr-2 h-4 w-4 text-[#3B8070] border-[#EEEEEE] rounded"
                  />
                  Bird
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#777777] uppercase tracking-wider">
                Scientific Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#777777] uppercase tracking-wider hidden md:table-cell">
                Family
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#777777] uppercase tracking-wider hidden lg:table-cell">
                Habitat
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#777777] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#EEEEEE]">
            {birds.map((bird) => (
              <BirdRow
                key={bird.id}
                bird={bird}
                isSelected={selectedBirds.has(bird.id)}
                onToggleSelection={() => onToggleSelection(bird.id)}
                onShowDetails={() => onShowDetails(bird)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface BirdRowProps {
  bird: Bird;
  isSelected: boolean;
  onToggleSelection: () => void;
  onShowDetails: () => void;
}

function BirdRow({
  bird,
  isSelected,
  onToggleSelection,
  onShowDetails,
}: BirdRowProps) {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = "https://via.placeholder.com/40x40?text=No+Image";

  return (
    <tr className="hover:bg-[#EEEEEE]">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="mr-3 h-4 w-4 text-[#3B8070] border-[#EEEEEE] rounded"
          />
          <div className="flex-shrink-0 h-10 w-10">
            <img 
              className="h-10 w-10 rounded-full object-cover" 
              src={imageError ? fallbackImage : (bird.imageUrl || fallbackImage)}
              alt={bird.name}
              onError={() => setImageError(true)}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-[#333333]">{bird.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-[#777777] italic">{bird.scientificName}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
        <div className="text-sm text-[#333333]">{bird.family || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
        <div className="text-sm text-[#333333]">{bird.habitat || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button 
          onClick={onShowDetails}
          className="text-[#3B8070] hover:underline"
        >
          View Details
        </button>
      </td>
    </tr>
  );
}
