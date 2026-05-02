/**
 * Adds family data to every bird in the database and bird_data.json.
 * Run with: npx tsx scripts/update-bird-families.ts
 *
 * Families based on CBRO (Comitê Brasileiro de Registros Ornitológicos)
 * and current IOC classification.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { readFileSync, writeFileSync } from 'fs';
import { birds } from '../shared/schema';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// id → family (CBRO / IOC classification)
const BIRD_FAMILIES: Record<number, string> = {
  1:  'Thraupidae',      // Saí-verde          Chlorophanes spiza
  2:  'Thraupidae',      // Saí-azul            Dacnis cayana
  3:  'Thraupidae',      // Saíra-sete-cores    Tangara seledon
  4:  'Tyrannidae',      // Capitão-de-saíra    Attila rufus
  5:  'Thraupidae',      // Saíra-militar       Tangara cyanocephala
  6:  'Thraupidae',      // Sanhaço-do-coqueiro Thraupis palmarum
  7:  'Thraupidae',      // Sanhaço-enc-amarelo Thraupis ornata
  8:  'Thraupidae',      // Sanhaço-enc-azul    Thraupis cyanoptera
  9:  'Thraupidae',      // Sanhaço-cinzento    Thraupis sayaca
  10: 'Fringillidae',    // Ferro-velho         Euphonia pectoralis
  11: 'Thraupidae',      // Tiê-sangue          Ramphocelus bresilia
  12: 'Thraupidae',      // Tiê-preto           Tachyphonus coronatus
  13: 'Thraupidae',      // Tiê-de-bando        Habia rubica
  14: 'Thraupidae',      // Tiê-de-topete       Trichothraupis melanops
  15: 'Thraupidae',      // Catirumbava         Orthogonys chloricterus
  16: 'Turdidae',        // Sabiá-laranjeira    Turdus rufiventris
  17: 'Turdidae',        // Sabiá-una           Turdus flavipes
  18: 'Turdidae',        // Sabiá-coleira       Turdus albicollis
  19: 'Turdidae',        // Sabiá-poca          Turdus amaurochalinus
  20: 'Turdidae',        // Sabiá-barranco      Turdus leucomelas
  21: 'Pipridae',        // Tangará             Chiroxiphia caudata
  22: 'Fringillidae',    // Gaturamo-rei        Cyanophonia cyanocephala
  23: 'Cuculidae',       // Alma-de-gato        Piaya cayana
  24: 'Trogonidae',      // Surucuá-variado     Trogon surrucura
  25: 'Trogonidae',      // Surucuá-b-amarela   Trogon viridis
  26: 'Psittacidae',     // Tiriba-testa-verm.  Pyrrhura frontalis
  27: 'Psittacidae',     // Periquito-rico      Brotogeris tirica
  28: 'Psittacidae',     // Papagaio-moleiro    Amazona farinosa
  29: 'Thraupidae',      // Canário-da-terra    Sicalis flaveola
  30: 'Estrildidae',     // Bico de lacre       Estrilda astrild
  31: 'Tyrannidae',      // Bem-te-vi           Pitangus sulphuratus
  32: 'Tyrannidae',      // Bem-te-vi-pirata    Legatus leucophaius
  33: 'Tyrannidae',      // Bentevizinho        Myiozetetes similis
  34: 'Tyrannidae',      // Suiriri             Tyrannus melancholicus
  35: 'Thraupidae',      // Cambacica           Coereba flaveola
  36: 'Tyrannidae',      // Viuvinha            Colonia colonus
  37: 'Passerellidae',   // Tico-tico           Zonotrichia capensis
  38: 'Thamnophilidae',  // Chorozinho-asa-verm Herpsilochmus rufimarginatus
  39: 'Picidae',         // Pica-pau-rei        Campephilus robustus
  40: 'Picidae',         // João velho          Celeus flavescens
  41: 'Picidae',         // Benedito-testa-am.  Melanerpes flavifrons
  42: 'Dendrocolaptidae',// Arapaçu-verde       Sittasomus griseicapillus
  43: 'Alcedinidae',     // Martim-pescador     Megaceryle torquata
  44: 'Tinamidae',       // Macuco              Tinamus solitarius
  45: 'Cracidae',        // Jacutinga           Aburria jacutinga
  46: 'Ardeidae',        // Socó-boi            Tigrisoma lineatum
  47: 'Columbidae',      // Rolinha             Columbina talpacoti
  48: 'Columbidae',      // Juriti              Leptotila verreauxi
  49: 'Columbidae',      // Pomba trocal        Patagioenas speciosa
  50: 'Columbidae',      // Pomba amargosa      Patagioenas plumbea
  51: 'Cotingidae',      // Araponga            Procnias nudicollis
  52: 'Vireonidae',      // Juruviara           Vireo chivi
  53: 'Vireonidae',      // Pitiguari           Cyclarhis gujanensis
  54: 'Troglodytidae',   // Corruíra            Troglodytes musculus
  55: 'Parulidae',       // Pula-pula           Basileuterus culicivorus
  56: 'Falconidae',      // Carcará             Caracara plancus
  57: 'Accipitridae',    // Gavião carijó       Rupornis magnirostris
  58: 'Accipitridae',    // Gavião asa de telha Parabuteo unicinctus
  59: 'Accipitridae',    // Gavião bombachinha  Harpagus diodon
  60: 'Trochilidae',     // Beija flor rajado   Ramphodon naevius
  61: 'Trochilidae',     // Beija fl. bico torto Glaucis hirsutus
  62: 'Trochilidae',     // Beija fl. fr.violeta Thalurania glaucopis
  63: 'Trochilidae',     // Beija flor rubi     Heliodoxa rubricauda
  64: 'Trochilidae',     // Beija flor cinza    Aphantochroa cirrochloris
  65: 'Trochilidae',     // Beija flor preto    Florisuga fusca
  66: 'Trochilidae',     // Beija flor tesoura  Eupetomena macroura
  67: 'Trochilidae',     // Beija fl. fr.preta  Anthracothorax nigricollis
  68: 'Trochilidae',     // Beija fl. topetinho Lophornis chalybeus
  69: 'Ramphastidae',    // Araçari poca        Selenidera maculirostris
  70: 'Ramphastidae',    // Tucano bico verde   Ramphastos dicolorus
};

async function main() {
  // 1. Update database
  console.log('Updating bird families in database...\n');
  let dbUpdated = 0;
  for (const [idStr, family] of Object.entries(BIRD_FAMILIES)) {
    const id = parseInt(idStr);
    const result = await db.update(birds).set({ family }).where(eq(birds.id, id));
    console.log(`  ${String(id).padStart(2, ' ')}. ${family}`);
    dbUpdated++;
  }
  console.log(`\nDatabase: ${dbUpdated} birds updated.`);

  // 2. Update bird_data.json for future re-seeds
  console.log('\nUpdating bird_data.json...');
  const birdData: any[] = JSON.parse(readFileSync('./bird_data.json', 'utf8'));
  for (const bird of birdData) {
    const family = BIRD_FAMILIES[bird.id];
    if (family) bird.family = family;
  }
  writeFileSync('./bird_data.json', JSON.stringify(birdData, null, 2), 'utf8');
  console.log('bird_data.json updated.\n');

  await pool.end();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
