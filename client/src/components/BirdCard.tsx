import React, { useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Check } from 'lucide-react';
import type { BirdWithSeenStatus } from '@shared/schema';
import { announce } from '@/lib/utils';

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(bird);
    }
  };

  const handleSeenToggle = (e: React.MouseEvent) => {
    // Stop the click from propagating to the card click handler
    e.stopPropagation();
    if (onToggleSeen) {
      onToggleSeen(bird);
    }
    announce(bird.seen ? `${bird.name} marcada como não vista` : `${bird.name} marcada como vista`);
  };

  const descriptionId = `bird-${bird.id}-desc`;

  return (
    <div
      id={`bird-card-${bird.id}`}
      className={`${bird.seen ? 'bg-[#F5FFF5]' : 'bg-white'} rounded-lg p-2 sm:p-3 transition-all duration-300 ${isExpanded ? 'bg-[#F9FBF9]' : 'cursor-pointer hover:shadow-md hover:-translate-y-1'}`}
      onClick={isExpanded ? undefined : () => onClick(bird)}
      role={isExpanded ? undefined : 'button'}
      tabIndex={isExpanded ? -1 : 0}
      onKeyDown={handleKeyDown}
      aria-label={isExpanded ? undefined : `Ver detalhes da ave ${bird.name}`}
      aria-describedby={isExpanded ? undefined : descriptionId}
      aria-expanded={isExpanded}
      aria-controls={isExpanded ? undefined : `bird-${bird.id}-details`}
    >
      <div className="relative">
        {/* Placeholder shown until image loads */}
        {!imageLoaded && !imageError && (
          <div className="w-[7.5rem] h-[7.5rem] sm:w-[8.125rem] sm:h-[8.125rem] rounded-full bg-gray-200 animate-pulse block mx-auto"></div>
        )}

        <LazyLoadImage
          src={imageUrl}
          alt={`Foto da ave ${bird.name}`}
          effect="blur"
          className={`w-[7.5rem] h-[7.5rem] sm:w-[8.125rem] sm:h-[8.125rem] rounded-full object-cover block mx-auto ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />

        {/* Seen indicator */}
        {bird.seen && (
          <div className="absolute top-0 right-0 bg-[#4CAF50] text-white rounded-full p-1" aria-hidden="true">
            <Check className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="text-center mt-2 sm:mt-3 flex flex-col items-center w-full px-1">
        <h3 className="font-montserrat font-semibold text-base sm:text-lg w-full break-words">{bird.name}</h3>
        <p className="text-xs sm:text-sm text-gray-600 italic w-full break-words">{bird.scientificName}</p>
        <span id={descriptionId} className="visually-hidden">
          Nome científico {bird.scientificName}. {bird.seen ? 'Marcada como vista.' : 'Ainda não vista.'} Pressione Enter ou Espaço para abrir os detalhes.
        </span>

        {onToggleSeen && (
          <button
            onClick={handleSeenToggle}
            className={`mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors z-50 relative ${
              bird.seen
                ? 'bg-[#DDEBDD] text-[#4CAF50] hover:bg-[#C8E6C9]'
                : 'bg-[#4CAF50] text-white hover:bg-[#388E3C]'
            }`}
            aria-pressed={bird.seen}
            aria-label={bird.seen ? `Marcar ${bird.name} como não vista` : `Marcar ${bird.name} como vista`}
          >
            {bird.seen ? 'Visto ✓' : 'Vi na Toca!'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BirdCard;
