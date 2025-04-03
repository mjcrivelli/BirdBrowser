import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { BirdWithSeenStatus } from '@shared/schema';
import { generateBirdsPDF } from '@/lib/pdfGenerator';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface BirdCounterProps {
  seenBirds: BirdWithSeenStatus[];
}

const BirdCounter: React.FC<BirdCounterProps> = ({ seenBirds }) => {
  const [showDialog, setShowDialog] = useState(false);
  
  const count = seenBirds.length;
  const text = count === 1 ? 'ave vista' : 'aves vistas';
  
  const handleCounterClick = () => {
    setShowDialog(true);
  };
  
  const handleDownloadPDF = async () => {
    await generateBirdsPDF(seenBirds);
    setShowDialog(false);
  };
  
  return (
    <>
      <div 
        className="fixed right-6 bottom-6 bg-[#4CAF50] text-white py-2 px-4 rounded-full shadow-lg cursor-pointer hover:bg-[#388E3C] transition-colors flex items-center gap-2"
        onClick={handleCounterClick}
      >
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">
          {count} {text}
        </span>
      </div>
      
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Baixar Lista de Aves</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja baixar um PDF com todas as {count} {text} que você registrou?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDownloadPDF}>
              Baixar PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BirdCounter;