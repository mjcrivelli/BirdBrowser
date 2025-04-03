import { birds, type Bird, type InsertBird } from "@shared/schema";
import { readBirdsFromExcel } from "./excel-reader";
import { getFallbackBirds } from "./fallback-birds";

// Define the interface for bird storage operations
export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  getAllBirds(): Promise<Bird[]>;
  getBird(id: number): Promise<Bird | undefined>;
  createBird(bird: InsertBird): Promise<Bird>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private birdData: Map<number, Bird>;
  currentId: number;
  currentBirdId: number;

  constructor() {
    this.users = new Map();
    this.birdData = new Map();
    this.currentId = 1;
    this.currentBirdId = 1;
    
    // Initialize with bird data from Excel
    this.initializeBirds();
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllBirds(): Promise<Bird[]> {
    return Array.from(this.birdData.values());
  }

  async getBird(id: number): Promise<Bird | undefined> {
    return this.birdData.get(id);
  }

  async createBird(insertBird: InsertBird): Promise<Bird> {
    const id = this.currentBirdId++;
    // Ensure all properties conform to Bird type
    const bird: Bird = { 
      id,
      name: insertBird.name,
      scientificName: insertBird.scientificName,
      family: insertBird.family ?? null,
      habitat: insertBird.habitat ?? null,
      diet: insertBird.diet ?? null,
      conservationStatus: insertBird.conservationStatus ?? null,
      description: insertBird.description ?? null,
      wikipediaUrl: insertBird.wikipediaUrl ?? null,
      imageUrl: insertBird.imageUrl ?? null,
      category: insertBird.category ?? "common",
    };
    this.birdData.set(id, bird);
    return bird;
  }

  private initializeBirds() {
    try {
      // Use our simplified fallback birds for now
      // Later we can try to read from Excel file again
      console.log("Using fallback bird data");
      const birds = getFallbackBirds();
      
      // Process the birds
      birds.forEach((bird, index) => {
        const id = index + 1;
        // Ensure all properties are properly defined to match Bird type
        const validBird: Bird = {
          id,
          name: bird.name,
          scientificName: bird.scientificName,
          family: bird.family ?? null,
          habitat: bird.habitat ?? null,
          diet: bird.diet ?? null,
          conservationStatus: bird.conservationStatus ?? null,
          description: bird.description ?? null,
          wikipediaUrl: bird.wikipediaUrl ?? null,
          imageUrl: bird.imageUrl ?? null,
          category: bird.category ?? null,
        };
        this.birdData.set(id, validBird);
      });
      this.currentBirdId = birds.length + 1;
      return;
    } catch (error) {
      console.error("Error initializing birds:", error);
    }
    
    // If something goes wrong, we'll use hardcoded data
    const sampleBirds: Omit<Bird, 'id'>[] = [
      {
        name: "Golden Eagle",
        scientificName: "Aquila chrysaetos",
        family: "Accipitridae",
        habitat: "Mountains, open country, semi-desert",
        diet: "Small mammals, birds, reptiles",
        conservationStatus: "Least Concern",
        description: "The Golden Eagle is one of the best-known birds of prey in the Northern Hemisphere. It is the most widely distributed species of eagle. These birds are dark brown, with lighter golden-brown plumage on their napes. Immature eagles have white patches at the base of the primaries and white tails with black bands.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Golden_eagle",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Golden_Eagle_in_flight_-_5.jpg/800px-Golden_Eagle_in_flight_-_5.jpg",
        category: "common"
      },
      {
        name: "Blue Jay",
        scientificName: "Cyanocitta cristata",
        family: "Corvidae",
        habitat: "Forests, suburban areas, parks",
        diet: "Nuts, seeds, insects, small vertebrates",
        conservationStatus: "Least Concern",
        description: "The Blue Jay is a passerine bird in the corvid family, native to eastern North America. It is resident through most of eastern and central United States and southern Canada. Blue Jays are known for their intelligence, complex social systems, and noisy calls.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Blue_jay",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Blue_jay_in_PP_%2830960%29.jpg/800px-Blue_jay_in_PP_%2830960%29.jpg",
        category: "common"
      },
      {
        name: "American Robin",
        scientificName: "Turdus migratorius",
        family: "Turdidae",
        habitat: "Woodlands, Gardens",
        diet: "Insects, Fruits",
        conservationStatus: "Least Concern",
        description: "The American robin is a migratory songbird of the true thrush genus and Turdidae, the wider thrush family. It is widely distributed throughout North America, wintering from southern Canada to central Mexico and along the Pacific Coast. It is the state bird of Connecticut, Michigan, and Wisconsin.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/American_robin",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Turdus-migratorius-002.jpg/800px-Turdus-migratorius-002.jpg",
        category: "common"
      },
      {
        name: "Red-tailed Hawk",
        scientificName: "Buteo jamaicensis",
        family: "Accipitridae",
        habitat: "Open country, woodlands, mountains",
        diet: "Small mammals, birds, reptiles",
        conservationStatus: "Least Concern",
        description: "The Red-tailed Hawk is a bird of prey that breeds throughout most of North America, from the interior of Alaska and northern Canada to as far south as Panama and the West Indies. It is one of the most common members within the genus of Buteo in North America or worldwide.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Red-tailed_hawk",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Buteo_jamaicensis_-John_Heinz_National_Wildlife_Refuge_at_Tinicum%2C_Pennsylvania%2C_USA-8.jpg/800px-Buteo_jamaicensis_-John_Heinz_National_Wildlife_Refuge_at_Tinicum%2C_Pennsylvania%2C_USA-8.jpg",
        category: "common"
      },
      {
        name: "Northern Cardinal",
        scientificName: "Cardinalis cardinalis",
        family: "Cardinalidae",
        habitat: "Gardens, woodlands, shrublands",
        diet: "Seeds, fruits, insects",
        conservationStatus: "Least Concern",
        description: "The Northern Cardinal is a bird in the genus Cardinalis; it is also known colloquially as the redbird, common cardinal, red cardinal, or just cardinal. It can be found in southeastern Canada, through the eastern United States from Maine to Minnesota to Texas, and south through Mexico, Belize, and Guatemala.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Northern_cardinal",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cardinal.jpg/800px-Cardinal.jpg",
        category: "common"
      },
      {
        name: "Black-capped Chickadee",
        scientificName: "Poecile atricapillus",
        family: "Paridae",
        habitat: "Deciduous and mixed forests, parks, suburbs",
        diet: "Insects, seeds, berries",
        conservationStatus: "Least Concern",
        description: "The Black-capped Chickadee is a small, nonmigratory, North American songbird that lives in deciduous and mixed forests. It is famous for its ability to lower its body temperature during cold winter nights, becoming torpid. The Black-capped Chickadee is the state bird of Massachusetts and Maine in the United States.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Black-capped_chickadee",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Poecile-atricapilla-001.jpg/800px-Poecile-atricapilla-001.jpg",
        category: "common"
      },
      {
        name: "Bald Eagle",
        scientificName: "Haliaeetus leucocephalus",
        family: "Accipitridae",
        habitat: "Coasts, lakes, rivers",
        diet: "Fish, birds, carrion",
        conservationStatus: "Least Concern",
        description: "The Bald Eagle is a bird of prey found in North America. A sea eagle, it has two known subspecies and forms a species pair with the White-tailed Eagle. Its range includes most of Canada and Alaska, all of the contiguous United States, and northern Mexico. It is the national bird and symbol of the United States of America.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Bald_eagle",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/About_to_Launch_%2826075320352%29.jpg/800px-About_to_Launch_%2826075320352%29.jpg",
        category: "common"
      },
      {
        name: "Great Blue Heron",
        scientificName: "Ardea herodias",
        family: "Ardeidae",
        habitat: "Wetlands, coastal areas",
        diet: "Fish, amphibians, reptiles, small mammals",
        conservationStatus: "Least Concern",
        description: "The Great Blue Heron is a large wading bird in the family Ardeidae, common near the shores of open water and in wetlands over most of North America and Central America, as well as the Caribbean and the Galápagos Islands. It is a rare vagrant to coastal Spain, the Azores, and areas of far southern Europe.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Great_blue_heron",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/GBHfish5.jpg/800px-GBHfish5.jpg",
        category: "common"
      },
      {
        name: "Peregrine Falcon",
        scientificName: "Falco peregrinus",
        family: "Falconidae",
        habitat: "Various, from tundra to deserts",
        diet: "Birds",
        conservationStatus: "Least Concern",
        description: "The Peregrine Falcon is a widespread bird of prey in the family Falconidae. A large, crow-sized falcon, it has a blue-grey back, barred white underparts, and a black head. It is famous for its speed, reaching over 320 km/h (200 mph) during its characteristic hunting stoop, making it the fastest bird in the world.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Peregrine_falcon",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Falco_peregrinus_good_-_Christopher_Watson.jpg/800px-Falco_peregrinus_good_-_Christopher_Watson.jpg",
        category: "rare"
      },
      {
        name: "Ruby-throated Hummingbird",
        scientificName: "Archilochus colubris",
        family: "Trochilidae",
        habitat: "Gardens, woodlands, meadows",
        diet: "Nectar, small insects",
        conservationStatus: "Least Concern",
        description: "The Ruby-throated Hummingbird is a species of hummingbird that generally spends the winter in Central America, Mexico, and Florida, and migrates to Eastern North America for the summer to breed. It is by far the most common hummingbird seen east of the Mississippi River in North America.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Ruby-throated_hummingbird",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Archilochus-colubris-003.jpg/800px-Archilochus-colubris-003.jpg",
        category: "common"
      },
      {
        name: "California Condor",
        scientificName: "Gymnogyps californianus",
        family: "Cathartidae",
        habitat: "Remote, steep, forested mountains",
        diet: "Carrion",
        conservationStatus: "Critically Endangered",
        description: "The California Condor is a New World vulture, the largest North American land bird. This condor became extinct in the wild in 1987, but has since been reintroduced to northern Arizona and southern Utah, the coastal mountains of central and southern California, and northern Baja California.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/California_condor",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Gymnogyps_californianus_-San_Diego_Zoo-8a.jpg/800px-Gymnogyps_californianus_-San_Diego_Zoo-8a.jpg",
        category: "endangered"
      },
      {
        name: "Atlantic Puffin",
        scientificName: "Fratercula arctica",
        family: "Alcidae",
        habitat: "Rocky islands, North Atlantic",
        diet: "Fish",
        conservationStatus: "Vulnerable",
        description: "The Atlantic Puffin is a species of seabird in the auk family. It is the only puffin native to the Atlantic Ocean; two related species, the Tufted Puffin and the Horned Puffin, are found in the northeastern Pacific. The Atlantic Puffin breeds in Iceland, Norway, Greenland, Newfoundland, and many North Atlantic islands.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Atlantic_puffin",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Puffin_%28Fratercula_arctica%29.jpg/800px-Puffin_%28Fratercula_arctica%29.jpg",
        category: "rare"
      },
      {
        name: "Whooping Crane",
        scientificName: "Grus americana",
        family: "Gruidae",
        habitat: "Wetlands, plains",
        diet: "Omnivorous: plants, invertebrates, small vertebrates",
        conservationStatus: "Endangered",
        description: "The Whooping Crane, the tallest North American bird, is an endangered crane species named for its whooping sound. In 2003, there were about 153 pairs of whooping cranes. Along with the Sandhill Crane, it is one of only two crane species found in North America.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Whooping_crane",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Whooping_Crane_-_Grus_americana.jpg/800px-Whooping_Crane_-_Grus_americana.jpg",
        category: "endangered"
      },
      {
        name: "Barn Owl",
        scientificName: "Tyto alba",
        family: "Tytonidae",
        habitat: "Open countryside, farmland",
        diet: "Small mammals",
        conservationStatus: "Least Concern",
        description: "The Barn Owl is the most widely distributed species of owl and one of the most widespread of all birds. Found almost everywhere in the world except polar and desert regions, Asia north of the Himalayas, and some Pacific islands. Known for its distinctive heart-shaped face and silent flight.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Barn_owl",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Tyto_alba_close_up.jpg/800px-Tyto_alba_close_up.jpg",
        category: "common"
      },
      {
        name: "Resplendent Quetzal",
        scientificName: "Pharomachrus mocinno",
        family: "Trogonidae",
        habitat: "Cloud forests",
        diet: "Fruit, insects, small vertebrates",
        conservationStatus: "Near Threatened",
        description: "The Resplendent Quetzal is a bird in the trogon family. It is found from southern Mexico to western Panama. It is well known for its colorful plumage. There are two subspecies, P. m. mocinno and P. m. costaricensis, which are sometimes treated as separate species.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Resplendent_quetzal",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Pharomachrus_mocinno_Costa_Rica.jpg/800px-Pharomachrus_mocinno_Costa_Rica.jpg",
        category: "rare"
      },
      {
        name: "Kiwi",
        scientificName: "Apteryx",
        family: "Apterygidae",
        habitat: "Forests, grasslands",
        diet: "Invertebrates, fruit, seeds",
        conservationStatus: "Varies by species (Endangered to Near Threatened)",
        description: "Kiwi are flightless birds endemic to New Zealand, in the genus Apteryx and family Apterygidae. Approximately the size of a domestic chicken, kiwi are by far the smallest living ratites and lay the largest egg in relation to their body size of any species of bird in the world.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Kiwi_(bird)",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Southern_Brown_Kiwi_1.jpg/800px-Southern_Brown_Kiwi_1.jpg",
        category: "endangered"
      },
      {
        name: "Scarlet Macaw",
        scientificName: "Ara macao",
        family: "Psittacidae",
        habitat: "Rainforests, woodlands",
        diet: "Seeds, nuts, fruits, nectar",
        conservationStatus: "Least Concern",
        description: "The Scarlet Macaw is a large red, yellow, and blue Central and South American parrot, a member of a large group of Neotropical parrots called macaws. It is native to humid evergreen forests of tropical Central and South America. Range extends from south-eastern Mexico to the Peruvian Amazon.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Scarlet_macaw",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Ara_macao_-_two_at_Lowry_Park_Zoo.jpg/800px-Ara_macao_-_two_at_Lowry_Park_Zoo.jpg",
        category: "rare"
      },
      {
        name: "Snowy Owl",
        scientificName: "Bubo scandiacus",
        family: "Strigidae",
        habitat: "Arctic tundra, grasslands",
        diet: "Small mammals, birds",
        conservationStatus: "Vulnerable",
        description: "The Snowy Owl is a large, white owl of the true owl family. Snowy Owls are native to Arctic regions in North America and Eurasia. Males are almost all white, while females have more flecks of black plumage. Juvenile Snowy Owls have black feathers until they turn white.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Snowy_owl",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Snowy_Owl_%28240866707%29.jpeg/800px-Snowy_Owl_%28240866707%29.jpeg",
        category: "rare"
      },
      {
        name: "American Woodcock",
        scientificName: "Scolopax minor",
        family: "Scolopacidae",
        habitat: "Young forests, shrublands",
        diet: "Earthworms, insects",
        conservationStatus: "Least Concern",
        description: "The American Woodcock is a small chunky shorebird species found primarily in the eastern half of the United States and throughout southeastern Canada. They are unusual among shorebirds in that they live in forested areas rather than open wetlands, usually occupying moist woodlands near fields, thickets, and emergent wetlands.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/American_woodcock",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Scolopax-minor-001.jpg/800px-Scolopax-minor-001.jpg",
        category: "common"
      },
      {
        name: "Burrowing Owl",
        scientificName: "Athene cunicularia",
        family: "Strigidae",
        habitat: "Open grasslands, deserts",
        diet: "Small vertebrates, insects",
        conservationStatus: "Least Concern",
        description: "The Burrowing Owl is a small, long-legged owl found throughout open landscapes of North and South America. Burrowing Owls can be found in grasslands, rangelands, agricultural areas, deserts, or any other open dry area with low vegetation. Unlike most owls, Burrowing Owls are often active during the day, although they tend to avoid the midday heat.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Burrowing_owl",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Burrowing_Owl_4433_%284x6%29.jpg/800px-Burrowing_Owl_4433_%284x6%29.jpg",
        category: "common"
      },
      {
        name: "Greater Flamingo",
        scientificName: "Phoenicopterus roseus",
        family: "Phoenicopteridae",
        habitat: "Shallow lakes, lagoons",
        diet: "Algae, small crustaceans",
        conservationStatus: "Least Concern",
        description: "The Greater Flamingo is the most widespread and largest species of the flamingo family. It is found in Africa, the Indian subcontinent, the Middle East, and southern Europe. This is the largest species of flamingo, averaging 110–150 cm tall and weighing 2–4 kg. The largest male flamingos have been recorded at up to 187 cm tall and 4.5 kg.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Greater_flamingo",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Greater_flamingo_Phoenicopterus_roseus.jpg/800px-Greater_flamingo_Phoenicopterus_roseus.jpg",
        category: "common"
      },
      {
        name: "Kakapo",
        scientificName: "Strigops habroptilus",
        family: "Strigopidae",
        habitat: "Forests, scrublands",
        diet: "Plants, seeds, pollen, fruit",
        conservationStatus: "Critically Endangered",
        description: "The Kakapo, also called owl parrot, is a species of large, flightless, nocturnal, ground-dwelling parrot of the super-family Strigopoidea, endemic to New Zealand. It has finely blotched yellow-green plumage, a distinct facial disc, a large grey beak, short legs, large feet, and relatively short wings and tail.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Kakapo",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Strigops_habroptilus_1.jpg/800px-Strigops_habroptilus_1.jpg",
        category: "endangered"
      },
      {
        name: "Andean Cock-of-the-rock",
        scientificName: "Rupicola peruvianus",
        family: "Cotingidae",
        habitat: "Andean cloud forests",
        diet: "Fruits, insects, small vertebrates",
        conservationStatus: "Least Concern",
        description: "The Andean Cock-of-the-rock is a large passerine bird of the cotinga family native to Andean cloud forests in South America. It is widely regarded as the national bird of Peru. The male has a large disk-like crest and scarlet or brilliant orange plumage, while the female is significantly darker and browner.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Andean_cock-of-the-rock",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Andean_Cock-of-the-rock_%28Rupicola_peruvianus%29.jpg/800px-Andean_Cock-of-the-rock_%28Rupicola_peruvianus%29.jpg",
        category: "rare"
      },
      {
        name: "Philippine Eagle",
        scientificName: "Pithecophaga jefferyi",
        family: "Accipitridae",
        habitat: "Tropical rainforests",
        diet: "Flying lemurs, monkeys, snakes, other birds",
        conservationStatus: "Critically Endangered",
        description: "The Philippine Eagle, also known as the Monkey-eating Eagle or Great Philippine Eagle, is among the tallest, rarest, largest, and most powerful birds in the world. A bird of prey belonging to the family Accipitridae, it is endemic to forests in the Philippines. It has brown and white-colored plumage, a shaggy crest, and measures 86–102 cm in length.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Philippine_eagle",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Philippine_Eagle_%28Pithecophaga_jefferyi%29.jpg/800px-Philippine_Eagle_%28Pithecophaga_jefferyi%29.jpg",
        category: "endangered"
      },
      {
        name: "Secretary Bird",
        scientificName: "Sagittarius serpentarius",
        family: "Sagittariidae",
        habitat: "Grasslands, savannas",
        diet: "Small mammals, snakes, insects",
        conservationStatus: "Endangered",
        description: "The Secretary Bird is a large, mostly terrestrial bird of prey. Endemic to Africa, it is usually found in the open grasslands and savanna of the sub-Saharan region. The Secretary Bird has distinctive black feathers that extend from the back of its head, a body like an eagle's and the legs of a crane.",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Secretarybird",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Secretary_Bird_%2831599789701%29.jpg/800px-Secretary_Bird_%2831599789701%29.jpg",
        category: "endangered"
      }
    ];

    // Add birds to the storage
    sampleBirds.forEach((bird, index) => {
      this.birdData.set(index + 1, { ...bird, id: index + 1 });
    });
    
    this.currentBirdId = sampleBirds.length + 1;
  }
}

export const storage = new MemStorage();
