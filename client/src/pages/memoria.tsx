import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const images = [
  '/img/img1.jpg',
  '/img/img2.jpg',
  '/img/img3.jpg',
  '/img/img4.jpg',
  '/img/img5.jpg',
  '/img/img6.jpg',
];

interface Card {
  id: number;
  img: string;
  matched: boolean;
}

const Memoria: React.FC = () => {
  const [cards, setCards] = useState<Card[]>(() =>
    [...images, ...images]
      .sort(() => Math.random() - 0.5)
      .map((img, index) => ({ id: index, img, matched: false }))
  );
  const [flipped, setFlipped] = useState<number[]>([]);

  const handleFlip = (index: number) => {
    if (flipped.includes(index) || flipped.length === 2 || cards[index].matched) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].img === cards[second].img) {
        setCards(prev =>
          prev.map(card =>
            card.id === cards[first].id || card.id === cards[second].id
              ? { ...card, matched: true }
              : card
          )
        );
      }
      // Desvira cartas não correspondentes depois de 1 segundo
      setTimeout(() => setFlipped([]), 1000);
    }
  };

  const handleRestart = () => {
    setCards(
      [...images, ...images]
        .sort(() => Math.random() - 0.5)
        .map((img, index) => ({ id: index, img, matched: false }))
    );
    setFlipped([]);
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Jogo da Memória</h1>

        <div className="flex justify-center mb-6">
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Reiniciar
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {cards.map((card, index) => {
            const isFlipped = flipped.includes(index) || card.matched;

            return (
              <div
                key={card.id}
                className="relative w-full h-32 cursor-pointer perspective"
                onClick={() => handleFlip(index)}
              >
                <div
                  className={`absolute w-full h-full transition-transform duration-500 transform ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Frente da carta */}
                  <div
                    className="absolute w-full h-full bg-gray-400 flex items-center justify-center rounded-lg"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-24 h-24 bg-gray-600 rounded" />
                  </div>

                  {/* Verso da carta */}
                  <div
                    className="absolute w-full h-full flex items-center justify-center rounded-lg"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <img
                      src={card.img}
                      alt="Ave"
                      className="h-24 w-24 object-cover rounded"
                    />
                  </div>
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
