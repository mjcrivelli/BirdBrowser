import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BirdWithSeenStatus } from '@shared/schema';

interface BirdDetailProps {
  bird: BirdWithSeenStatus;
  onClose: () => void;
  onToggleSeen?: (bird: BirdWithSeenStatus) => void;
}

const BirdDetail: React.FC<BirdDetailProps> = ({ bird, onClose, onToggleSeen }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
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
  
  const handleOpenWikipedia = () => {
    if (bird?.wikipediaUrl) {
      window.open(bird.wikipediaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSeenToggle = () => {
    if (onToggleSeen) {
      onToggleSeen(bird);
    }
  };

  return (
    <div 
      className={`w-full border ${bird.seen ? 'border-[#4CAF50]' : 'border-[#DDEBDD]'} rounded-lg p-6 bg-[#F9FBF9] shadow-md`}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up to parent
    >
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-montserrat font-bold">{bird.name}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      <p className="text-md text-gray-600 italic">{bird.scientificName}</p>
      
      <div className="flex flex-col md:flex-row gap-6 mt-4">
        <div className="md:w-1/3 mb-6 md:mb-0">
          {!imageLoaded && (
            <div className="w-full h-[250px] rounded-lg bg-gray-200 animate-pulse"></div>
          )}
          
          <img 
            src={imageUrl} 
            alt={bird.name} 
            className={`w-full h-auto max-h-[250px] rounded-lg object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.log(`Failed to load detail image for ${bird.name}: ${imageUrl}`);
              if (bird.imageUrl && bird.imageUrl.startsWith('//')) {
                (e.target as HTMLImageElement).src = `https:${bird.imageUrl}`;
              }
            }}
          />
          
          {onToggleSeen && (
            <Button 
              className={`mt-4 w-full ${
                bird.seen 
                  ? 'bg-[#DDEBDD] text-[#4CAF50] hover:bg-[#C8E6C9]'
                  : 'bg-[#4CAF50] hover:bg-[#388E3C] text-white'
              }`}
              onClick={handleSeenToggle}
            >
              {bird.seen ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Visto
                </>
              ) : (
                'Vi na Toca!'
              )}
            </Button>
          )}
        </div>
        
        <div className="md:w-2/3">
          <div className="mb-4">
            <h3 className="font-montserrat font-semibold text-lg mb-2">Descrição</h3>
            <p>{bird.description}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-montserrat font-semibold text-lg mb-2">Habitat</h3>
            <p>{bird.habitat}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-montserrat font-semibold text-lg mb-2">Dieta</h3>
            <p>{bird.diet}</p>
          </div>
          
          <div className="mt-6">
            <Button 
              className="bg-[#4CAF50] hover:bg-[#388E3C] text-white font-montserrat" 
              onClick={handleOpenWikipedia}
            >
              Ver na Wikipedia
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirdDetail;