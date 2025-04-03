import json

# Define direct image URLs for birds with known issues
DIRECT_URLS = {
    "Saíra-sete-cores": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Tangara_seledon_Itamambuca_Eco_Resort.jpg",
    "Capitão-de-saíra": "https://upload.wikimedia.org/wikipedia/commons/9/9b/Attila_rufus_-_Rufous-tailed_Attila.jpg",
    "Tiê-preto": "https://upload.wikimedia.org/wikipedia/commons/f/ff/Tachyphonus_coronatus.jpg",
    "Tiê-sangue": "https://upload.wikimedia.org/wikipedia/commons/e/ea/Ramphocelus_bresilius_-_Braziliaanse_tangare_-_male_-_Brazil.jpg",
    "Tiê-de-bando": "https://upload.wikimedia.org/wikipedia/commons/1/11/Habia_rubica.JPG",
    "Ferro-velho": "https://upload.wikimedia.org/wikipedia/commons/0/08/Euphonia_pectoralis_4.jpg",
    "Sanhaço-de-encontro-azul": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Tangara_cyanoptera_-_Blue-winged_Mountain-tanager.jpg",
    "Gavião asa de telha": "https://upload.wikimedia.org/wikipedia/commons/a/a0/Parabuteo_unicinctus_-falconry_display-8a.jpg"
}

def fix_bird_images(json_path):
    """
    Fix the problematic image URLs in the bird data JSON file
    """
    try:
        # Read the JSON file
        with open(json_path, 'r', encoding='utf-8') as f:
            birds_data = json.load(f)
        
        # Process each bird
        updated_count = 0
        for bird in birds_data:
            # If the bird name is in our direct URLs list, use that URL
            if bird['name'] in DIRECT_URLS:
                print(f"Using predefined direct URL for {bird['name']}")
                bird['imageUrl'] = DIRECT_URLS[bird['name']]
                updated_count += 1
            # For all other birds, convert wikipedia special path to direct URLs
            elif 'Special:FilePath' in bird['imageUrl']:
                filename = bird['imageUrl'].split('/')[-1]
                # Use the upload.wikimedia.org direct URL format
                bird['imageUrl'] = f"https://upload.wikimedia.org/wikipedia/commons/thumb/latest/{filename}/500px-{filename}"
                print(f"Converted URL for {bird['name']}")
                updated_count += 1
        
        # Write the updated data back to the JSON file
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(birds_data, f, ensure_ascii=False, indent=2)
        
        print(f"Updated {updated_count} bird images in {json_path}")
        return True
    
    except Exception as e:
        print(f"Error fixing bird data: {e}")
        return False

if __name__ == "__main__":
    json_path = "bird_data.json"
    fix_bird_images(json_path)