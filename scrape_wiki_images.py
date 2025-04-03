import requests
from bs4 import BeautifulSoup
import json
import time

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

def get_wikipedia_image_url(wiki_url):
    """
    Get the direct image URL from the Wikipedia page
    """
    if not wiki_url:
        return None
    
    try:
        # Add a delay to avoid hammering the server
        time.sleep(0.5)
        
        # Request the Wikipedia page
        response = requests.get(wiki_url, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the image in the infobox
        infobox = soup.find('table', class_='infobox')
        if infobox:
            # Try to get the image from the infobox first
            img = infobox.find('img')
            if img and img.has_attr('src'):
                img_url = img['src']
                if not img_url.startswith('http'):
                    img_url = 'https:' + img_url
                return img_url
        
        # If no infobox or no image in infobox, try to get the image from the content
        content_div = soup.find('div', class_='mw-parser-output')
        if content_div:
            img = content_div.find('img')
            if img and img.has_attr('src'):
                img_url = img['src']
                if not img_url.startswith('http'):
                    img_url = 'https:' + img_url
                return img_url
            
        # For "Ficheiro:" pages, get the image from the file page
        if 'Ficheiro:' in wiki_url or 'File:' in wiki_url:
            file_links = soup.select('div.fullImageLink a')
            if file_links:
                img_url = file_links[0]['href']
                if not img_url.startswith('http'):
                    img_url = 'https:' + img_url
                return img_url
        
        return None
    except Exception as e:
        print(f"Error getting image from {wiki_url}: {e}")
        return None

def fix_bird_data_json(json_path):
    """
    Fix the image URLs in the bird data JSON file
    """
    try:
        # Read the JSON file
        with open(json_path, 'r', encoding='utf-8') as f:
            birds_data = json.load(f)
        
        # Process each bird
        for bird in birds_data:
            # If the bird name is in our direct URLs list, use that URL
            if bird['name'] in DIRECT_URLS:
                print(f"Using predefined direct URL for {bird['name']}")
                bird['imageUrl'] = DIRECT_URLS[bird['name']]
            # Otherwise, attempt to get the image URL from the Wikipedia page
            elif bird['wikipediaUrl']:
                # Skip if it's already a direct URL to avoid unnecessary requests
                if 'upload.wikimedia.org' in bird['imageUrl']:
                    print(f"Skipping {bird['name']} - already has a direct URL")
                    continue
                
                print(f"Fetching image for {bird['name']} from {bird['wikipediaUrl']}")
                direct_image_url = get_wikipedia_image_url(bird['wikipediaUrl'])
                if direct_image_url:
                    print(f"Found direct image URL for {bird['name']}: {direct_image_url}")
                    bird['imageUrl'] = direct_image_url
                else:
                    print(f"Could not find direct image URL for {bird['name']}")
                    
                    # Convert the Special:FilePath URL to a direct URL format
                    if 'Special:FilePath' in bird['imageUrl']:
                        filename = bird['imageUrl'].split('/')[-1]
                        bird['imageUrl'] = f"https://upload.wikimedia.org/wikipedia/commons/thumb/latest/{filename}/500px-{filename}"
                        print(f"Converted to direct URL: {bird['imageUrl']}")
        
        # Write the updated data back to the JSON file
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(birds_data, f, ensure_ascii=False, indent=2)
        
        print(f"Updated {json_path} with {len(birds_data)} birds")
        return True
    
    except Exception as e:
        print(f"Error fixing bird data: {e}")
        return False

if __name__ == "__main__":
    json_path = "bird_data.json"
    fix_bird_data_json(json_path)