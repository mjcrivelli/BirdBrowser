import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(__dirname, '../../public/memoria/memoria.js'), 'utf-8');

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this._innerHTML = '';
    this.children = [];
    this.src = '';
    this.classList = {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    };
    this.dataset = {};
    this._listeners = {};
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) {
    this._innerHTML = v;
    if (v === '') this.children = [];
  }

  appendChild(child) { this.children.push(child); }

  addEventListener(event, fn) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(fn);
  }

  click() {
    for (const fn of (this._listeners.click || [])) fn.call(this);
  }
}

function buildGame({ syncTimeout = true } = {}) {
  const elems = {};
  const doc = {
    getElementById(id) { return (elems[id] = elems[id] || new MockElement(id)); },
    createElement(tag) { return new MockElement(tag); },
  };
  const ctx = vm.createContext({
    document: doc,
    setTimeout: syncTimeout ? (fn) => fn() : () => {},
    alert: () => {},
  });
  vm.runInContext(source, ctx);
  return doc;
}

describe('createBoard()', () => {
  test('cria 12 cartas no tabuleiro', () => {
    const doc = buildGame();
    assert.equal(doc.getElementById('game-board').children.length, 12);
  });

  test('cada carta tem dataset.image definido', () => {
    const doc = buildGame();
    for (const card of doc.getElementById('game-board').children) {
      assert.ok(card.dataset.image, 'cada carta deve ter dataset.image');
    }
  });

  test('cada imagem aparece exatamente 2 vezes', () => {
    const doc = buildGame();
    const counts = {};
    for (const card of doc.getElementById('game-board').children) {
      const img = card.dataset.image;
      counts[img] = (counts[img] || 0) + 1;
    }
    for (const [img, n] of Object.entries(counts)) {
      assert.equal(n, 2, `"${img}" deve aparecer exatamente 2 vezes`);
    }
  });
});

describe('flipCard()', () => {
  test('adiciona classe "flipped" ao clicar', () => {
    const doc = buildGame({ syncTimeout: false });
    const card = doc.getElementById('game-board').children[0];
    card.click();
    assert.ok(card.classList.contains('flipped'));
  });

  test('não permite re-virar carta já virada', () => {
    const doc = buildGame({ syncTimeout: false });
    const card = doc.getElementById('game-board').children[0];
    card.click();
    card.click(); // segunda tentativa — deve ser ignorada
    assert.ok(card.classList.contains('flipped'));
  });

  test('não vira terceira carta enquanto duas estão viradas', () => {
    // syncTimeout: false → checkMatch é enfileirado mas não executado
    const doc = buildGame({ syncTimeout: false });
    const [c1, c2, c3] = doc.getElementById('game-board').children;
    c1.click();
    c2.click(); // 2 cartas viradas, checkMatch pendente
    c3.click(); // deve ser bloqueada
    assert.ok(!c3.classList.contains('flipped'));
  });
});

describe('checkMatch()', () => {
  test('cartas com mesma imagem permanecem viradas', () => {
    const doc = buildGame();
    const board = doc.getElementById('game-board');
    const byImage = {};
    for (const card of board.children) {
      (byImage[card.dataset.image] = byImage[card.dataset.image] || []).push(card);
    }
    const [c1, c2] = Object.values(byImage).find(p => p.length === 2);
    c1.click();
    c2.click();
    assert.ok(c1.classList.contains('flipped'), 'c1 deve continuar virada');
    assert.ok(c2.classList.contains('flipped'), 'c2 deve continuar virada');
  });

  test('cartas com imagens diferentes são desviradas', () => {
    // syncTimeout: true → setTimeout dispara imediatamente, desvirando as cartas
    const doc = buildGame();
    const children = [...doc.getElementById('game-board').children];
    let c1 = null, c2 = null;
    outer: for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        if (children[i].dataset.image !== children[j].dataset.image) {
          c1 = children[i]; c2 = children[j];
          break outer;
        }
      }
    }
    c1.click();
    c2.click();
    assert.ok(!c1.classList.contains('flipped'), 'c1 deve ser desvirada');
    assert.ok(!c2.classList.contains('flipped'), 'c2 deve ser desvirada');
  });
});
