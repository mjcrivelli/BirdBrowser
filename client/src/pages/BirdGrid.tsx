import React, { useState } from 'react';
import BirdCard from '@/components/BirdCard';
import BirdDetail from '@/components/BirdDetail';
import BirdCounter from '@/components/BirdCounter';
import EmptyState from '@/components/EmptyState';
import { useBirds, useBirdSightings } from '@/hooks/useBirds';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Eye, Filter } from 'lucide-react';
import type { BirdWithSeenStatus } from '@shared/schema';
import { announce } from '@/lib/utils';

const BirdGrid: React.FC = () => {
  // Get bird data using our hooks
  const { birds, seenBirds, unseenBirds, isLoading, isError, refetch } = useBirds();
  const { toggleBirdSeenStatus, isPending } = useBirdSightings();

  // Local state
  const [selectedBirdId, setSelectedBirdId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Handle clicking on a bird card to expand/collapse details
  const handleBirdSelection = (bird: BirdWithSeenStatus) => {
    setSelectedBirdId(prevId => prevId === bird.id ? null : bird.id);
    if (selectedBirdId === bird.id) {
      announce(`Fechando detalhes de ${bird.name}`);
    } else {
      announce(`Abrindo detalhes de ${bird.name}`);
    }
  };

  // Close the detailed view and restore focus to the originating card
  const closeDetail = () => {
    const idToRestore = selectedBirdId;
    setSelectedBirdId(null);
    // After the card re-renders, restore focus
    if (idToRestore != null) {
      setTimeout(() => {
        const card = document.getElementById(`bird-card-${idToRestore}`);
        if (card) {
          (card as HTMLElement).focus();
        }
        const b = birds.find(brd => brd.id === idToRestore);
        if (b) {
          announce(`Fechando detalhes de ${b.name}`);
        }
      }, 0);
    }
  };

  // Handle toggling the seen status of a bird
  const handleToggleSeen = (bird: BirdWithSeenStatus) => {
    console.log('BirdGrid - handleToggleSeen called with:', bird.id, bird.name, bird.seen);
    toggleBirdSeenStatus(bird);
    announce(bird.seen ? `${bird.name} marcada como não vista` : `${bird.name} marcada como vista`);
  };

  // Determine which birds to display based on active tab
  const displayBirds =
    activeTab === 'all' ? birds :
    activeTab === 'seen' ? seenBirds :
    unseenBirds;

  // Loading state
  if (isLoading || isPending) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-center mb-8">Aves da Cachoeira da Toca</h1>
          <div className="flex justify-center mb-8">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 mb-12">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="rounded-lg p-2 sm:p-3 bg-white">
                <div className="flex justify-center">
                  <Skeleton className="w-[7.5rem] h-[7.5rem] sm:w-[8.125rem] sm:h-[8.125rem] rounded-full" />
                </div>
                <div className="text-center mt-2 sm:mt-3">
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <Skeleton className="h-3 w-1/2 mx-auto mt-2" />
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
      <main className="container mx-auto px-4 py-8 relative">
        <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-center mb-8">Aves da Cachoeira da Toca</h1>

        {/* Seen birds counter */}
        {seenBirds.length > 0 && (
          <BirdCounter seenBirds={seenBirds} />
        )}

        {/* Tabs for filtering birds */}
        <div className="flex justify-center mb-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all" className="font-montserrat text-xs sm:text-sm">
                Todas ({birds.length})
              </TabsTrigger>
              <TabsTrigger value="seen" className="font-montserrat text-xs sm:text-sm">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Vistas ({seenBirds.length})
              </TabsTrigger>
              <TabsTrigger value="unseen" className="font-montserrat text-xs sm:text-sm">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Não vistas ({unseenBirds.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {displayBirds.length > 0 ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 mb-12" role="list" aria-label="Lista de aves">
            {displayBirds.map((bird) => {
              // If this bird is selected, render BirdDetail in its place
              if (bird.id === selectedBirdId) {
                return (
                  <li key={bird.id} className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6">
                    <BirdDetail
                      bird={bird}
                      onClose={closeDetail}
                      onToggleSeen={handleToggleSeen}
                    />
                  </li>
                );
              }

              // Otherwise render the BirdCard
              return (
                <li key={bird.id}>
                  <BirdCard
                    bird={bird}
                    onClick={handleBirdSelection}
                    onToggleSeen={handleToggleSeen}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          // If the filtered list is empty
          <EmptyState
            message={
              activeTab === 'seen'
                ? "Você ainda não marcou nenhuma ave como vista. Explore a lista de aves e marque as que você já viu!"
                : "Nenhuma ave encontrada com os filtros selecionados."
            }
          />
        )}
      </main>

      <Footer />
    </>
  );
};

export default BirdGrid;
