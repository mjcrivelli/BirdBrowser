import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useBirds } from '@/hooks/useBirds';

const Memoria: React.FC = () => {
  const { birds } = useBirds();

  const buildDeck = (birdList: typeof birds) => {
    const pool = birdList.slice(0, 6);
    return [...pool, ...pool]
      .sort(() => Math.random() - 0.5)
      .map((b, i) => ({ uid: i, birdId: b.id, name: b.name, img: b.imageUrl, matched: false }));
  };

  const [cards, setCards] = useState<ReturnType<typeof buildDeck>>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (birds.length > 0 && !initialized.current) {
      setCards(buildDeck(birds));
      initialized.current = true;
    }
  }, [birds]);

  const matchedCount = cards.filter(c => c.matched).length / 2;
  const totalPairs = 6;
  const allMatched = matchedCount === totalPairs && totalPairs > 0;

  const handleFlip = (index: number) => {
    const card = cards[index];
    if (!card || flipped.includes(index) || flipped.length === 2 || card.matched) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].birdId === cards[second].birdId) {
        setCards(prev =>
          prev.map((c, i) =>
            i === first || i === second ? { ...c, matched: true } : c
          )
        );
        const pairs = matchedCount + 1;
        setAnnouncement(pairs === totalPairs
          ? 'Parabéns! Você encontrou todos os pares!'
          : `Par encontrado! ${pairs} de ${totalPairs} pares.`
        );
      } else {
        setAnnouncement('Não combina. Tente novamente.');
      }
      setTimeout(() => setFlipped([]), 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip(index);
    }
  };

  const handleRestart = () => {
    if (birds.length > 0) {
      setCards(buildDeck(birds));
      setFlipped([]);
      setAnnouncement('Jogo reiniciado.');
    }
  };

  if (cards.length === 0) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Carregando jogo…</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <h1 className="text-3xl font-bold text-center font-montserrat mb-1">Jogo da Memória</h1>
        <p className="text-center text-gray-500 text-sm mb-2" aria-live="polite" aria-atomic="true">
          {matchedCount} de {totalPairs} pares encontrados
        </p>

        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={handleRestart}
            className="px-5 py-2 rounded font-semibold text-white"
            style={{ backgroundColor: '#0f783a' }}
            aria-label="Reiniciar o jogo da memória"
          >
            Reiniciar
          </button>
        </div>

        {allMatched && (
          <div role="alert" className="text-center font-bold text-lg mb-4" style={{ color: '#0f783a' }}>
            Parabéns! Você encontrou todos os pares!
          </div>
        )}

        <div
          className="grid grid-cols-3 sm:grid-cols-4 gap-3"
          role="grid"
          aria-label="Tabuleiro do jogo da memória"
        >
          {cards.map((card, index) => {
            const isVisible = flipped.includes(index) || card.matched;
            let cardLabel: string;
            if (card.matched) {
              cardLabel = `Par encontrado: ${card.name}`;
            } else if (isVisible) {
              cardLabel = `Carta revelada: ${card.name}`;
            } else {
              cardLabel = `Carta ${index + 1} virada para baixo — pressione Enter para virar`;
            }
            const canFlip = !card.matched && flipped.length < 2 && !flipped.includes(index);

            return (
              <div
                key={card.uid}
                role="gridcell"
              >
                <div
                  role="button"
                  tabIndex={canFlip ? 0 : -1}
                  aria-label={cardLabel}
                  aria-pressed={card.matched}
                  className="w-full rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    height: '8rem',
                    cursor: canFlip ? 'pointer' : 'default',
                    border: card.matched ? '2px solid #0f783a' : '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    outlineColor: '#0f783a',
                  }}
                  onClick={() => handleFlip(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                >
                  {isVisible ? (
                    <img
                      src={card.img}
                      alt={card.name}
                      className="w-full h-full object-cover object-top"
                      style={{ opacity: card.matched ? 0.7 : 1 }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: '#9ca3af' }}
                    >
                      <div style={{ width: '3rem', height: '3rem', backgroundColor: '#6b7280', borderRadius: '0.375rem' }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Memoria;
