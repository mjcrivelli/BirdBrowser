import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function html(rel) {
  return readFileSync(path.join(root, rel), 'utf-8');
}

describe('client/index.html', () => {
  const src = html('client/index.html');

  test('tem atributo lang="pt-BR"', () => {
    assert.ok(src.includes('lang="pt-BR"'));
  });

  test('tem link de acessibilidade skip-link', () => {
    assert.ok(src.includes('skip-link') || src.includes('skip-to-content'));
  });

  test('tem região aria-live para anúncios de leitores de tela', () => {
    assert.ok(src.includes('aria-live'));
  });

  test('tem div#root para montagem do React', () => {
    assert.ok(src.includes('id="root"'));
  });

  test('carrega o módulo principal via <script type="module">', () => {
    assert.ok(src.includes('type="module"'));
    assert.ok(src.includes('main.tsx') || src.includes('/src/main'));
  });

  test('tem fallback <noscript>', () => {
    assert.ok(src.includes('<noscript>'));
  });

  test('declara charset UTF-8', () => {
    assert.ok(src.toLowerCase().includes('charset="utf-8"'));
  });

  test('tem meta viewport para responsividade', () => {
    assert.ok(src.includes('name="viewport"'));
  });
});

describe('public/memoria/memoria.html', () => {
  const src = html('public/memoria/memoria.html');

  test('tem div#game-board para o tabuleiro do jogo', () => {
    assert.ok(src.includes('id="game-board"'));
  });

  test('tem botão#restart de reinício', () => {
    assert.ok(src.includes('id="restart"'));
  });

  test('carrega memoria.js', () => {
    assert.ok(src.includes('memoria.js'));
  });

  test('carrega memoria.css', () => {
    assert.ok(src.includes('memoria.css'));
  });

  test('tem atributo lang="pt-BR"', () => {
    assert.ok(src.includes('lang="pt-BR"'));
  });

  test('declara charset UTF-8', () => {
    assert.ok(src.toLowerCase().includes('charset="utf-8"'));
  });
});
