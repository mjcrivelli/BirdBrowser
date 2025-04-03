import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bird } from "@shared/schema";
import { useState } from "react";
import { XIcon, ExternalLinkIcon } from "lucide-react";

interface BirdDetailModalProps {
  bird: Bird | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected: boolean;
  onToggleSelection: () => void;
}

export function BirdDetailModal({
  bird,
  isOpen,
  onClose,
  isSelected,
  onToggleSelection,
}: BirdDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = "https://via.placeholder.com/500x500?text=No+Image";

  if (!bird) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="flex justify-between items-center p-4 border-b border-[#EEEEEE]">
          <DialogTitle className="text-xl font-semibold text-[#3B8070]">Bird Details</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-[#777777] hover:text-[#D0502B] p-1"
          >
            <XIcon className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              <img
                src={imageError ? fallbackImage : (bird.imageUrl || fallbackImage)}
                alt={bird.name}
                className="w-full rounded-md object-cover"
                onError={() => setImageError(true)}
              />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <div>
                <h3 className="text-2xl font-semibold">{bird.name}</h3>
                <p className="text-lg text-[#777777] italic">{bird.scientificName}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#777777]">Family:</span>
                  <span className="font-medium">{bird.family || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Habitat:</span>
                  <span className="font-medium">{bird.habitat || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Diet:</span>
                  <span className="font-medium">{bird.diet || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Conservation Status:</span>
                  <span className="font-medium">{bird.conservationStatus || 'Unknown'}</span>
                </div>
              </div>
              
              <p className="text-[#333333]">
                {bird.description || 'No description available.'}
              </p>
              
              {bird.wikipediaUrl && (
                <a
                  href={bird.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-[#3B8070] hover:underline"
                >
                  View on Wikipedia
                  <ExternalLinkIcon className="h-4 w-4 inline-block ml-1" />
                </a>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="p-4 border-t border-[#EEEEEE]">
          <Button
            onClick={onToggleSelection}
            variant="outline"
            className={`border-[#3B8070] text-[#3B8070] hover:bg-[#3B8070] hover:text-white`}
          >
            {isSelected ? 'Deselect Bird' : 'Select Bird'}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="bg-[#EEEEEE] text-[#333333] hover:bg-opacity-80"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
