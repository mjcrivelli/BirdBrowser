import React, { useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
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
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    // Use the image URL directly from the bird data
    // Add https: prefix to protocol-relative URLs
    if (bird.imageUrl && bird.imageUrl.startsWith('//')) {
      setImageUrl(`https:${bird.imageUrl}`);
    } else {
      setImageUrl(bird.imageUrl);
    }
  }, [bird.imageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    console.log(`Failed to load image for ${bird.name}: ${imageUrl}`);
    
    // Only attempt one simple fallback - add https: if it's missing
    if (bird.imageUrl && bird.imageUrl.startsWith('//')) {
      const fixedUrl = `https:${bird.imageUrl}`;
      (e.target as HTMLImageElement).src = fixedUrl;
    }
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
      className={`${bird.seen ? 'bg-[#F5FFF5]' : 'bg-white'} rounded-lg p-2 sm:p-3 transition-all duration-300 ${isExpanded ? 'bg-[#F9FBF9]' : 'cursor-pointer hover:shadow-md hover:-translate-y-1'}`}
      onClick={isExpanded ? undefined : () => onClick(bird)}
    >
      <div className="relative">
        {/* Placeholder shown until image loads */}
        {!imageLoaded && !imageError && (
          <div className="w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] rounded-full bg-gray-200 animate-pulse block mx-auto"></div>
        )}
        
        <LazyLoadImage
          src={imageUrl}
          alt={bird.name}
          effect="blur"
          className={`w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] rounded-full object-cover block mx-auto ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Seen indicator */}
        {bird.seen && (
          <div className="absolute top-0 right-0 bg-[#4CAF50] text-white rounded-full p-1">
            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
        )}
      </div>
      
      <div className="text-center mt-2 sm:mt-3 flex flex-col items-center w-full px-1">
        <h3 className="font-montserrat font-semibold text-base sm:text-lg w-full overflow-hidden text-ellipsis whitespace-nowrap">{bird.name}</h3>
        <p className="text-xs sm:text-sm text-gray-600 italic w-full overflow-hidden text-ellipsis whitespace-nowrap">{bird.scientificName}</p>
        
        {onToggleSeen && (
          <button 
            onClick={handleSeenToggle} 
            className={`mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              bird.seen 
                ? 'bg-[#DDEBDD] text-[#4CAF50] hover:bg-[#C8E6C9]'
                : 'bg-[#4CAF50] text-white hover:bg-[#388E3C]'
            }`}
          >
            {bird.seen ? 'Visto ✓' : 'Vi na Toca!'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BirdCard;
