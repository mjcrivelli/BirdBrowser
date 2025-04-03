import React from 'react';
import type { Bird } from '@shared/schema';

interface BirdCardProps {
  bird: Bird;
  onClick: (bird: Bird) => void;
}

const BirdCard: React.FC<BirdCardProps> = ({ bird, onClick }) => {
  return (
    <div 
      className="border border-[#DDEBDD] rounded-lg p-4 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
      onClick={() => onClick(bird)}
    >
      <div className="relative">
        <img 
          src={bird.imageUrl} 
          alt={bird.name} 
          className="w-[150px] h-[150px] rounded-full object-cover block mx-auto"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Not+Found';
          }}
        />
      </div>
      <div className="text-center mt-4">
        <h3 className="font-montserrat font-semibold text-lg">{bird.name}</h3>
        <p className="text-sm text-gray-600 italic">{bird.scientificName}</p>
      </div>
    </div>
  );
};

export default BirdCard;
