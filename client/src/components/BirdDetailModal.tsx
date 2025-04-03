import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Bird } from '@shared/schema';

interface BirdDetailModalProps {
  bird: Bird | null;
  open: boolean;
  onClose: () => void;
}

const BirdDetailModal: React.FC<BirdDetailModalProps> = ({ bird, open, onClose }) => {
  const handleOpenWikipedia = () => {
    if (bird?.wikipediaUrl) {
      window.open(bird.wikipediaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!bird) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="flex justify-between items-start">
          <DialogTitle className="text-2xl font-montserrat font-bold">{bird.name}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-6 mt-4">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <img 
              src={bird.imageUrl} 
              alt={bird.name} 
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500?text=Image+Not+Found';
              }}
            />
            <p className="text-sm text-gray-600 italic mt-2 text-center">{bird.scientificName}</p>
          </div>
          
          <div className="md:w-1/2">
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BirdDetailModal;
