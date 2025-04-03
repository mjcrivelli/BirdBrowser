import React, { useState } from 'react';
import BirdCard from '@/components/BirdCard';
import BirdDetailModal from '@/components/BirdDetailModal';
import EmptyState from '@/components/EmptyState';
import { useBirds } from '@/hooks/useBirds';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import type { Bird } from '@shared/schema';

const BirdGrid: React.FC = () => {
  const { birds, isLoading, isError } = useBirds();
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleBirdSelection = (bird: Bird) => {
    setSelectedBird(bird);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-center mb-12">Aves da Cachoeira da Toca</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="border border-[#DDEBDD] rounded-lg p-4">
                <div className="flex justify-center">
                  <Skeleton className="w-[150px] h-[150px] rounded-full" />
                </div>
                <div className="text-center mt-4">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-center mb-12">Aves da Cachoeira da Toca</h1>
          <EmptyState message="Ocorreu um erro ao carregar os dados das aves. Por favor, tente novamente mais tarde." />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-center mb-12">Aves da Cachoeira da Toca</h1>

        {birds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {birds.map((bird) => (
              <BirdCard 
                key={bird.id} 
                bird={bird} 
                onClick={handleBirdSelection} 
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      <BirdDetailModal 
        bird={selectedBird} 
        open={modalOpen} 
        onClose={closeModal} 
      />

      <Footer />
    </>
  );
};

export default BirdGrid;
