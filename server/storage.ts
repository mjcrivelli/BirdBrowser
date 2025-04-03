import { readFileSync } from 'fs';
import { Bird, BirdSighting, BirdWithSeenStatus, InsertBird, InsertBirdSighting, InsertUser, User } from '@shared/schema';

const DEFAULT_USER_ID = 1;

export interface IStorage {
  getBirds(): Promise<Bird[]>;
  getBirdsWithSeenStatus(userId?: number): Promise<BirdWithSeenStatus[]>;
  getBird(id: number): Promise<Bird | undefined>;
  createBird(bird: InsertBird): Promise<Bird>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  addBirdSighting(sighting: InsertBirdSighting): Promise<BirdSighting>;
  removeBirdSighting(userId: number, birdId: number): Promise<boolean>;
  getBirdSightings(userId: number): Promise<BirdSighting[]>;
}

export class MemStorage implements IStorage {
  private birds: Map<number, Bird>;
  private users: Map<number, User>;
  private birdSightings: Map<number, BirdSighting>;
  currentBirdId: number;
  currentUserId: number;
  currentSightingId: number;

  constructor() {
    this.birds = new Map();
    this.users = new Map();
    this.birdSightings = new Map();
    this.currentBirdId = 1;
    this.currentUserId = 1;
    this.currentSightingId = 1;
    
    // Initialize with data
    this.initializeBirds();
  }

  private initializeBirds() {
    try {
      // Try to read bird data from a JSON file
      const dataPath = './bird_data.json';
      const jsonData = readFileSync(dataPath, 'utf8');
      const birds: InsertBird[] = JSON.parse(jsonData);
      
      // Add birds to the storage
      birds.forEach(bird => {
        this.createBird(bird);
      });
      
      console.log(`Loaded ${birds.length} birds from data file`);
      
      // Create a default user
      const defaultUser: InsertUser = {
        username: "visitor",
        password: "password123"
      };
      const userId = this.currentUserId++;
      this.users.set(userId, { ...defaultUser, id: userId });
      return;
    } catch (error) {
      console.error('Error loading bird data:', error);
      // Fallback to a few sample birds if file loading fails
      const birdData: InsertBird[] = [
        {
          name: "Saíra-sete-cores",
          scientificName: "Tangara seledon",
          description: "A saíra-sete-cores é um pássaro da família Thraupidae. Caracteriza-se por apresentar diversas cores em sua plumagem, incluindo verde, azul, amarelo e vermelho. É uma espécie comum em áreas de Mata Atlântica, sendo encontrada principalmente em florestas e bordas de mata.",
          habitat: "Encontrada em florestas tropicais e subtropicais úmidas, principalmente na Mata Atlântica, desde o nível do mar até altitudes médias. Prefere o dossel e bordas de florestas.",
          diet: "Alimenta-se principalmente de frutos, sementes e insetos pequenos que encontra nas árvores e arbustos.",
          imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Tangara_seledon.jpg",
          wikipediaUrl: "https://pt.wikipedia.org/wiki/Sa%C3%ADra-sete-cores"
        },
      {
        name: "Saí-azul",
        scientificName: "Dacnis cayana",
        description: "O saí-azul é uma pequena ave passeriforme da família Thraupidae. O macho apresenta plumagem predominantemente azul-turquesa com máscara, asas e cauda pretas. A fêmea é verde-oliva com ventre mais claro.",
        habitat: "Habita florestas, bordas de mata, clareiras, capoeiras, parques e jardins arborizados, desde o nível do mar até cerca de 1.600 metros de altitude.",
        diet: "Alimenta-se de frutos, néctar e pequenos insetos que captura entre a vegetação.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Dacnis_cayana_-_Saí-azul.jpg/800px-Dacnis_cayana_-_Saí-azul.jpg",
        wikipediaUrl: "https://pt.wikipedia.org/wiki/Saí-azul"
      },
      {
        name: "Saíra-amarela",
        scientificName: "Tangara cayana",
        description: "A saíra-amarela é uma ave passeriforme da família Thraupidae. Apresenta plumagem predominantemente amarela com cabeça e peito avermelhados. É uma espécie comum e adaptável a diferentes ambientes.",
        habitat: "Ocorre em bordas de florestas, campos com árvores esparsas, cerrados, caatingas, parques e áreas urbanas arborizadas.",
        diet: "Alimenta-se de frutos, bagas e insetos. Frequentemente visita comedouros em áreas urbanas.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Burnished-buff_Tanager_%28Tangara_cayana%29.jpg/800px-Burnished-buff_Tanager_%28Tangara_cayana%29.jpg",
        wikipediaUrl: "https://pt.wikipedia.org/wiki/Saíra-amarela"
      },
      {
        name: "Sanhaço-cinzento",
        scientificName: "Thraupis sayaca",
        description: "O sanhaço-cinzento é uma ave passeriforme da família Thraupidae. Possui plumagem predominantemente cinza-azulada, com asas e cauda mais escuras. É uma das aves mais comuns em ambientes urbanos no Brasil.",
        habitat: "Habita uma grande variedade de ambientes, desde florestas até áreas urbanas, sendo muito comum em parques e jardins.",
        diet: "Alimenta-se principalmente de frutos, mas também consome insetos e pequenos invertebrados.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Thraupis_sayaca.jpg/800px-Thraupis_sayaca.jpg",
        wikipediaUrl: "https://pt.wikipedia.org/wiki/Sanhaço-cinzento"
      },
      {
        name: "Pica-pau-anão-de-coleira",
        scientificName: "Picumnus temminckii",
        description: "O pica-pau-anão-de-coleira é uma pequena ave piciforme da família Picidae. Possui plumagem marrom-olivácea no dorso e esbranquiçada com manchas escuras no ventre. Os machos apresentam pintas vermelhas na fronte.",
        habitat: "Ocorre em florestas, bordas de mata, capoeiras e áreas semi-abertas com árvores, principalmente na Mata Atlântica.",
        diet: "Alimenta-se de insetos, larvas e outros pequenos invertebrados que encontra perfurando a casca das árvores.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Collared_Piculet_%28Picumnus_temminckii%29.jpg/800px-Collared_Piculet_%28Picumnus_temminckii%29.jpg",
        wikipediaUrl: "https://pt.wikipedia.org/wiki/Pica-pau-anão-de-coleira"
      },
      {
        name: "Lavadeira-mascarada",
        scientificName: "Fluvicola nengeta",
        description: "A lavadeira-mascarada é uma ave passeriforme da família Tyrannidae. Possui plumagem predominantemente branca, com asas e cauda pretas e uma característica máscara preta na face.",
        habitat: "Habita áreas abertas próximas a corpos d'água, como pântanos, lagoas, rios e manguezais.",
        diet: "Alimenta-se principalmente de insetos que captura em voos curtos a partir de poleiros próximos à água.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Fluvicola_nengeta.jpg/800px-Fluvicola_nengeta.jpg",
        wikipediaUrl: "https://pt.wikipedia.org/wiki/Lavadeira-mascarada"
      },
      {
        name: "Beija-flor-tesoura",
        scientificName: "Eupetomena macroura",
        description: "O beija-flor-tesoura é uma espécie de beija-flor da família Trochilidae. Caracteriza-se pela longa cauda bifurcada, que lembra uma tesoura, e pela plumagem predominantemente azul-metálica.",
        habitat: "Ocorre em áreas abertas, bordas de mata, jardins e parques urbanos. É adaptável a ambientes modificados pelo homem.",
        diet: "Alimenta-se de néctar de flores e pequenos insetos. É territorial e agressivo com outros beija-flores.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Eupetomena_macroura.jpg/800px-Eupetomena_macroura.jpg",
        wikipediaUrl: "https://pt.wikipedia.org/wiki/Beija-flor-tesoura"
      },
      {
        name: "Jaçanã",
        scientificName: "Jacana jacana",
        description: "O jaçanã é uma ave caradriforme da família Jacanidae. Possui dedos e unhas muito longos que lhe permitem caminhar sobre a vegetação flutuante. Apresenta plumagem marrom-avermelhada com cabeça e pescoço pretos.",
        habitat: "Vive em áreas alagadas de água doce com vegetação flutuante, como lagoas, pântanos e brejos.",
        diet: "Alimenta-se de pequenos invertebrados aquáticos, sementes e outras partes de plantas aquáticas.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Jacana_jacana.jpg/800px-Jacana_jacana.jpg",
        wikipediaUrl: "https://pt.wikipedia.org/wiki/Jaçanã"
      }
      ];

      // Add birds to storage
      birdData.forEach(birdInfo => {
        this.createBird(birdInfo);
      });

      // Create default user
      const defaultUser: InsertUser = {
        username: "visitor",
        password: "password123"
      };
      const userId = this.currentUserId++;
      this.users.set(userId, { ...defaultUser, id: userId });
    }
  }

  async getBirds(): Promise<Bird[]> {
    return Array.from(this.birds.values());
  }

  async getBird(id: number): Promise<Bird | undefined> {
    return this.birds.get(id);
  }

  async createBird(insertBird: InsertBird): Promise<Bird> {
    const id = this.currentBirdId++;
    const bird: Bird = { ...insertBird, id };
    this.birds.set(id, bird);
    return bird;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getBirdsWithSeenStatus(userId?: number): Promise<BirdWithSeenStatus[]> {
    const birds = await this.getBirds();
    
    if (!userId) {
      // If no userId provided, return all birds with seen status set to false
      return birds.map(bird => ({ ...bird, seen: false }));
    }
    
    // Get all sightings for this user
    const userSightings = await this.getBirdSightings(userId);
    const seenBirdIds = new Set(userSightings.map(sighting => sighting.birdId));
    
    // Map each bird to include its seen status
    return birds.map(bird => ({
      ...bird,
      seen: seenBirdIds.has(bird.id)
    }));
  }
  
  async addBirdSighting(sighting: InsertBirdSighting): Promise<BirdSighting> {
    console.log(`Adding bird sighting: userId=${sighting.userId}, birdId=${sighting.birdId}`);
    
    // Check if this sighting already exists
    const existingSightings = Array.from(this.birdSightings.values()).filter(
      s => s.userId === sighting.userId && s.birdId === sighting.birdId
    );
    
    if (existingSightings.length > 0) {
      console.log(`Sighting already exists, returning existing: id=${existingSightings[0].id}`);
      return existingSightings[0];
    }
    
    // Create a new sighting
    const id = this.currentSightingId++;
    const newSighting: BirdSighting = { ...sighting, id };
    this.birdSightings.set(id, newSighting);
    
    console.log(`Created new sighting with id=${id}`);
    console.log(`Current sightings:`, Array.from(this.birdSightings.entries()));
    
    return newSighting;
  }
  
  async removeBirdSighting(userId: number, birdId: number): Promise<boolean> {
    console.log(`Removing bird sighting: userId=${userId}, birdId=${birdId}`);
    console.log(`Current sightings before removal:`, Array.from(this.birdSightings.entries()));
    
    // Find all sightings for this user and bird
    const sightingsToRemove = Array.from(this.birdSightings.entries())
      .filter(([_, s]) => s.userId === userId && s.birdId === birdId);
    
    if (sightingsToRemove.length === 0) {
      console.log(`No matching sightings found to remove.`);
      return true; // Return success even if nothing to delete
    }
    
    // Delete all matching sightings
    let success = true;
    for (const [id, _] of sightingsToRemove) {
      console.log(`Removing sighting with id=${id}`);
      const result = this.birdSightings.delete(id);
      if (!result) success = false;
    }
    
    console.log(`Current sightings after removal:`, Array.from(this.birdSightings.entries()));
    return success;
  }
  
  async getBirdSightings(userId: number): Promise<BirdSighting[]> {
    return Array.from(this.birdSightings.values()).filter(
      sighting => sighting.userId === userId
    );
  }
}

export const storage = new MemStorage();