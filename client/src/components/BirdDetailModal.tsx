import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Bird } from '@shared/schema';

interface BirdDetailModalProps {
  bird: Bird | null;
  open: boolean;
  onClose: () => void;
}

const BirdDetailModal: React.FC<BirdDetailModalProps> = ({ bird, open, onClose }) => {
  const handleOpenWikiaves = () => {
    const url = bird?.wikiavesUrl || bird?.wikipediaUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
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
            aria-label="Fechar modal de detalhes da ave"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 mt-4">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <img
              src={bird.imageUrl}
              alt={`Foto da ave ${bird.name}`}
              className="w-full h-auto rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500?text=Image+Not+Found';
              }}
            />
            <p className="text-sm text-gray-600 italic mt-2 text-center">{bird.scientificName}</p>
          </div>

          <div className="md:w-1/2">
            {(bird.sizeLength || bird.weightG || bird.sexualDimorphism) && (
              <div className="flex gap-2 mb-4 flex-wrap items-center">
                {bird.sizeLength && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                    📏 {bird.sizeLength} cm
                  </span>
                )}
                {bird.weightG && (
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                    ⚖️ {bird.weightG} g
                  </span>
                )}
                {bird.sexualDimorphism && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200">
                    ♂♀ Dimorfismo sexual: {bird.sexualDimorphism}
                  </span>
                )}
              </div>
            )}

            {bird.behavior && (
              <div className="mb-4">
                <h3 className="font-montserrat font-semibold text-lg mb-2">Comportamento</h3>
                <p>{bird.behavior}</p>
              </div>
            )}

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
                className="bg-transparent hover:bg-green-50 text-[#159d51] font-bold font-montserrat border border-[#159d51]"
                onClick={handleOpenWikiaves}
                aria-label={`Abrir página do WikiAves sobre ${bird?.name} em nova aba`}
              >
                Ver no WikiAves
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BirdDetailModal;
