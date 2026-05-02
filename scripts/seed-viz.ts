/**
 * Seed script for viz_test_sightings table.
 * Run with: npx tsx scripts/seed-viz.ts
 * Revert: set USE_VIZ_TABLE=false (or delete it) in dev env vars.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { vizTestSightings } from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ── Bird catalogue with relative weights (higher = more frequent) ────────────
const BIRDS: { id: number; name: string; weight: number }[] = [
  { id: 1,  name: 'Saí-verde',                          weight: 22 },
  { id: 2,  name: 'Saí-azul',                           weight: 18 },
  { id: 3,  name: 'Saíra-sete-cores',                   weight: 16 },
  { id: 4,  name: 'Capitão-de-saíra',                   weight: 20 },
  { id: 5,  name: 'Saíra-militar',                      weight: 19 },
  { id: 6,  name: 'Sanhaço-do-coqueiro',                weight: 14 },
  { id: 7,  name: 'Sanhaço-de-encontro-amarelo',        weight: 10 },
  { id: 8,  name: 'Sanhaço-de-encontro-azul',           weight: 8  },
  { id: 9,  name: 'Sanhaço-cinzento',                   weight: 15 },
  { id: 10, name: 'Ferro-velho',                        weight: 12 },
  { id: 11, name: 'Tiê-sangue',                         weight: 17 },
  { id: 12, name: 'Tiê-preto',                          weight: 13 },
  { id: 13, name: 'Tiê-de-bando',                       weight: 9  },
  { id: 14, name: 'Tiê-de-topete',                      weight: 7  },
  { id: 15, name: 'Catirumbava',                        weight: 6  },
  { id: 16, name: 'Sabiá-laranjeira',                   weight: 14 },
  { id: 17, name: 'Sabiá-una',                          weight: 5  },
  { id: 18, name: 'Sabiá-coleira',                      weight: 7  },
  { id: 19, name: 'Sabiá-poca',                         weight: 4  },
  { id: 20, name: 'Sabiá-barranco',                     weight: 5  },
  { id: 21, name: 'Tangará',                            weight: 18 },
  { id: 22, name: 'Gaturamo-rei',                       weight: 10 },
  { id: 23, name: 'Alma-de-gato',                       weight: 4  },
  { id: 24, name: 'Surucuá-variado',                    weight: 3  },
  { id: 25, name: 'Surucuá-de-barriga-amarela',         weight: 3  },
  { id: 26, name: 'Tiriba-de-testa-vermelha',           weight: 6  },
  { id: 27, name: 'Periquito-rico',                     weight: 7  },
  { id: 28, name: 'Papagaio-moleiro',                   weight: 5  },
  { id: 29, name: 'Canário-da-terra',                   weight: 11 },
  { id: 30, name: 'Bico de lacre',                      weight: 4  },
  { id: 31, name: 'Bem-te-vi',                          weight: 20 },
  { id: 32, name: 'Bem-te-vi-pirata',                   weight: 8  },
  { id: 33, name: 'Bentevizinho-de-penacho-vermelho',   weight: 9  },
  { id: 34, name: 'Suiriri',                            weight: 6  },
  { id: 35, name: 'Cambacica',                          weight: 12 },
  { id: 36, name: 'Viuvinha',                           weight: 4  },
  { id: 37, name: 'Tico-tico',                          weight: 8  },
  { id: 38, name: 'Chorozinho-de-asa-vermelha',         weight: 5  },
  { id: 39, name: 'Pica-pau-rei',                       weight: 11 },
  { id: 40, name: 'João velho',                         weight: 9  },
  { id: 41, name: 'Benedito-de-testa-amarela',          weight: 5  },
  { id: 42, name: 'Arapaçu-verde',                      weight: 4  },
  { id: 43, name: 'Martim-pescador',                    weight: 6  },
  { id: 44, name: 'Macuco',                             weight: 2  },
  { id: 45, name: 'Jacutinga',                          weight: 3  },
  { id: 46, name: 'Socó-boi',                           weight: 3  },
  { id: 47, name: 'Rolinha',                            weight: 8  },
  { id: 48, name: 'Juriti',                             weight: 7  },
  { id: 49, name: 'Pomba trocal',                       weight: 5  },
  { id: 50, name: 'Pomba amargosa',                     weight: 4  },
  { id: 51, name: 'Araponga',                           weight: 5  },
  { id: 52, name: 'Juruviara',                          weight: 6  },
  { id: 53, name: 'Pitiguari',                          weight: 7  },
  { id: 54, name: 'Corruíra',                           weight: 13 },
  { id: 55, name: 'Pula-pula',                          weight: 9  },
  { id: 56, name: 'Carcará',                            weight: 4  },
  { id: 57, name: 'Gavião carijó',                      weight: 5  },
  { id: 58, name: 'Gavião asa de telha',                weight: 3  },
  { id: 59, name: 'Gavião bombachinha grande',          weight: 2  },
  { id: 60, name: 'Beija flor rajado',                  weight: 10 },
  { id: 61, name: 'Beija flor balança rabo do bico torto', weight: 8 },
  { id: 62, name: 'Beija flor fronte violeta',          weight: 11 },
  { id: 63, name: 'Beija flor rubi',                   weight: 7  },
  { id: 64, name: 'Beija flor cinza',                   weight: 5  },
  { id: 65, name: 'Beija flor preto',                   weight: 9  },
  { id: 66, name: 'Beija flor tesoura',                 weight: 8  },
  { id: 67, name: 'Beija flor de frente preta',         weight: 10 },
  { id: 68, name: 'Beija flor topetinho verde',         weight: 12 },
  { id: 69, name: 'Araçari poca',                       weight: 4  },
  { id: 70, name: 'Tucano bico verde',                  weight: 6  },
];

const totalWeight = BIRDS.reduce((s, b) => s + b.weight, 0);

function pickBird(): typeof BIRDS[0] {
  let r = Math.random() * totalWeight;
  for (const b of BIRDS) {
    r -= b.weight;
    if (r <= 0) return b;
  }
  return BIRDS[BIRDS.length - 1];
}

// ── Month config ─────────────────────────────────────────────────────────────
const MONTHS = [
  { year: 2025, month: 12, season: 'summer', count: 78  },
  { year: 2026, month: 1,  season: 'summer', count: 94  },
  { year: 2026, month: 2,  season: 'summer', count: 112 },
  { year: 2026, month: 3,  season: 'autumn', count: 135 },
  { year: 2026, month: 4,  season: 'autumn', count: 122 },
];

// Cachoeira da Toca – Ilhabela, SP (most with location, ~30% without)
const TOCA_LAT = -23.78;
const TOCA_LON = -45.36;

function randomDate(year: number, month: number): Date {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomLocation(): { lat: number | null; lon: number | null } {
  if (Math.random() < 0.30) return { lat: null, lon: null }; // 30% no location
  // small jitter within ~3 km
  const lat = TOCA_LAT + (Math.random() - 0.5) * 0.05;
  const lon = TOCA_LON + (Math.random() - 0.5) * 0.05;
  return { lat, lon };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Clearing existing viz_test_sightings...');
  await db.delete(vizTestSightings);

  let total = 0;
  for (const { year, month, season, count } of MONTHS) {
    const rows = [];
    for (let i = 0; i < count; i++) {
      const bird = pickBird();
      const { lat, lon } = randomLocation();
      rows.push({
        birdId:    bird.id,
        birdName:  bird.name,
        timestamp: randomDate(year, month),
        latitude:  lat,
        longitude: lon,
        season,
      });
    }
    // Insert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      await db.insert(vizTestSightings).values(rows.slice(i, i + 50));
    }
    console.log(`  ${year}-${String(month).padStart(2,'0')}: inserted ${count} sightings (${season})`);
    total += count;
  }

  console.log(`\nDone! Total: ${total} sightings across ${MONTHS.length} months.`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
