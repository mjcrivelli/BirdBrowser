const board = document.getElementById("game-board");
const restartBtn = document.getElementById("restart");

const images = [
  "img1.jpg",
  "img2.jpg",
  "img3.jpg",
  "img4.jpg",
  "img5.jpg",
  "img6.jpg",
];

let cards = [...images, ...images].sort(() => 0.5 - Math.random());
let flippedCards = [];
let matched = [];

function createBoard() {
  board.innerHTML = "";
  cards.forEach((imgName, index) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.image = imgName;
    card.dataset.index = index;

    const img = document.createElement("img");
    img.src = `img/${imgName}`;
    card.appendChild(img);

    card.addEventListener("click", flipCard);
    board.appendChild(card);
  });
}

function flipCard() {
  if (flippedCards.length === 2 || this.classList.contains("flipped")) return;
  this.classList.add("flipped");
  flippedCards.push(this);
  if (flippedCards.length === 2) checkMatch();
}

function checkMatch() {
  const [c1, c2] = flippedCards;
  if (c1.dataset.image === c2.dataset.image) {
    matched.push(c1, c2);
    flippedCards = [];
    if (matched.length === cards.length) {
      setTimeout(() => alert("🎉 Parabéns! Você venceu!"), 500);
    }
  } else {
    setTimeout(() => {
      c1.classList.remove("flipped");
      c2.classList.remove("flipped");
      flippedCards = [];
    }, 800);
  }
}

restartBtn.addEventListener("click", () => {
  matched = [];
  flippedCards = [];
  cards = [...images, ...images].sort(() => 0.5 - Math.random());
  createBoard();
});

createBoard();
