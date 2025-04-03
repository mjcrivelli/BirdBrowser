import { Bird, InsertBird } from "@shared/schema";

// This is a fallback function to provide safe bird data
// in case the Excel file reading fails
export function getFallbackBirds(): InsertBird[] {
  return [
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
    }
  ];
}