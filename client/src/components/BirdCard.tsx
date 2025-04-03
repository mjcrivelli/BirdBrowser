import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { BirdWithSeenStatus } from '@shared/schema';

interface BirdCardProps {
  bird: BirdWithSeenStatus;
  onClick: (bird: BirdWithSeenStatus) => void;
  onToggleSeen?: (bird: BirdWithSeenStatus) => void;
  isExpanded?: boolean;
}

const BirdCard: React.FC<BirdCardProps> = ({ 
  bird, 
  onClick, 
  onToggleSeen,
  isExpanded = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Not+Found';
  };

  const handleSeenToggle = (e: React.MouseEvent) => {
    // Stop the click from propagating to the card click handler
    e.stopPropagation();
    if (onToggleSeen) {
      onToggleSeen(bird);
    }
  };

  return (
    <div 
      className={`border ${bird.seen ? 'border-[#4CAF50]' : 'border-[#DDEBDD]'} rounded-lg p-4 transition-all duration-300 ${isExpanded ? 'bg-[#F9FBF9]' : 'cursor-pointer hover:shadow-lg hover:-translate-y-1'}`}
      onClick={isExpanded ? undefined : () => onClick(bird)}
    >
      <div className="relative">
        {/* Placeholder shown until image loads */}
        {!imageLoaded && !imageError && (
          <div className="w-[150px] h-[150px] rounded-full bg-gray-200 animate-pulse block mx-auto"></div>
        )}
        
        <img 
          src={bird.imageUrl} 
          alt={bird.name} 
          className={`w-[150px] h-[150px] rounded-full object-cover block mx-auto ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Seen indicator */}
        {bird.seen && (
          <div className="absolute top-0 right-0 bg-[#4CAF50] text-white rounded-full p-1">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>
      
      <div className="text-center mt-4">
        <h3 className="font-montserrat font-semibold text-lg">{bird.name}</h3>
        <p className="text-sm text-gray-600 italic">{bird.scientificName}</p>
        
        {onToggleSeen && (
          <button 
            onClick={handleSeenToggle} 
            className={`mt-3 px-4 py-1 rounded-full text-sm font-medium transition-colors ${
              bird.seen 
                ? 'bg-[#DDEBDD] text-[#4CAF50] hover:bg-[#C8E6C9]'
                : 'bg-[#4CAF50] text-white hover:bg-[#388E3C]'
            }`}
          >
            {bird.seen ? 'Visto ✓' : 'Marcar como visto'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BirdCard;
