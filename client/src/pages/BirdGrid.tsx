import React, { useState } from 'react';
import BirdCard from '@/components/BirdCard';
import BirdDetail from '@/components/BirdDetail';
import EmptyState from '@/components/EmptyState';
import { useBirds, useBirdSightings } from '@/hooks/useBirds';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Eye, Filter } from 'lucide-react';
import type { BirdWithSeenStatus } from '@shared/schema';

const BirdGrid: React.FC = () => {
  const { birds, seenBirds, unseenBirds, isLoading, isError } = useBirds();
  const { toggleBirdSeenStatus, isPending } = useBirdSightings();
  const [selectedBirdId, setSelectedBirdId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const handleBirdSelection = (bird: BirdWithSeenStatus) => {
    setSelectedBirdId(prevId => prevId === bird.id ? null : bird.id);
  };

  const closeDetail = () => {
    setSelectedBirdId(null);
  };

  const handleToggleSeen = (bird: BirdWithSeenStatus) => {
    toggleBirdSeenStatus(bird);
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
        <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-center mb-8">Aves da Cachoeira da Toca</h1>
        
        {/* Tabs for filtering birds */}
        <div className="flex justify-center mb-8">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all" className="font-montserrat">
                Todas ({birds.length})
              </TabsTrigger>
              <TabsTrigger value="seen" className="font-montserrat">
                <Eye className="h-4 w-4 mr-1" />
                Vistas ({seenBirds.length})
              </TabsTrigger>
              <TabsTrigger value="unseen" className="font-montserrat">
                <Filter className="h-4 w-4 mr-1" />
                Não vistas ({unseenBirds.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {displayBirds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {displayBirds.map((bird) => {
              // If this bird is selected, render BirdDetail in its place
              if (bird.id === selectedBirdId) {
                return (
                  <div key={bird.id} className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <BirdDetail 
                      bird={bird} 
                      onClose={closeDetail}
                      onToggleSeen={handleToggleSeen}
                    />
                  </div>
                );
              }
              
              // Otherwise render the BirdCard
              return (
                <BirdCard 
                  key={bird.id} 
                  bird={bird} 
                  onClick={handleBirdSelection}
                  onToggleSeen={handleToggleSeen}
                />
              );
            })}
          </div>
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
