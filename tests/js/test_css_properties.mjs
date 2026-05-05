import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function css(rel) {
  return readFileSync(path.join(root, rel), 'utf-8');
}

describe('public/memoria/memoria.css', () => {
  const src = css('public/memoria/memoria.css');

  test('define seletor .card', () => {
    assert.ok(/\.card\b/.test(src));
  });

  test('define .card.flipped revelando a imagem da carta', () => {
    assert.ok(src.includes('.card.flipped'));
    // Revelação via display:block na imagem ao invés de rotação 3D
    assert.ok(src.includes('.card.flipped img'));
  });

  test('usa CSS Grid no layout do tabuleiro', () => {
    assert.ok(src.includes('display: grid') || src.includes('display:grid'));
  });

  test('tem media query para dispositivos móveis', () => {
    assert.ok(src.includes('@media'));
    assert.ok(src.includes('max-width'));
  });

  test('define variáveis CSS customizadas em :root', () => {
    assert.ok(src.includes(':root'));
    assert.ok(src.includes('--'));
  });

  test('suporta tema escuro', () => {
    assert.ok(src.includes('.dark') || src.includes('body.dark'));
  });

  test('define dimensões para .card', () => {
    assert.ok(/\.card\s*\{[^}]*width/.test(src));
  });
});

describe('client/src/index.css', () => {
  const src = css('client/src/index.css');

  test('define variáveis CSS em :root', () => {
    assert.ok(src.includes(':root'));
    assert.ok(src.includes('--background'));
  });

  test('define variável --foreground', () => {
    assert.ok(src.includes('--foreground'));
  });

  test('suporta tema escuro com .dark', () => {
    assert.ok(src.includes('.dark'));
  });

  test('importa fontes externas', () => {
    assert.ok(src.includes('@import'));
  });

  test('usa diretivas Tailwind CSS', () => {
    assert.ok(src.includes('@tailwind'));
  });

  test('define variável de raio de borda --radius', () => {
    assert.ok(src.includes('--radius'));
  });
});
