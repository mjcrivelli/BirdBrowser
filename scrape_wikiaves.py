import pandas as pd
import json
import os
import requests
from bs4 import BeautifulSoup
import time
import random

def get_wikiaves_image_url(url):
    """
    Get direct image URL from the WikiAves page
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
        
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch {url}, status code: {response.status_code}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # First try to find the main photo on the species page
        main_photo = soup.select_one('.contfoto img')
        if main_photo and main_photo.has_attr('src'):
            img_url = main_photo['src']
            # Make sure it's an absolute URL
            if not img_url.startswith('http'):
                img_url = 'https://www.wikiaves.com.br' + img_url
            return img_url
            
        # If not found, try the first photo in the gallery
        gallery_photos = soup.select('.galeria-container img')
        if gallery_photos and len(gallery_photos) > 0 and gallery_photos[0].has_attr('src'):
            img_url = gallery_photos[0]['src']
            # Make sure it's an absolute URL
            if not img_url.startswith('http'):
                img_url = 'https://www.wikiaves.com.br' + img_url
            return img_url
            
        # If still not found, look for any image that might be a bird photo
        all_images = soup.select('img')
        for img in all_images:
            if img.has_attr('src') and ('fotos' in img['src'] or 'images' in img['src']) and not img['src'].endswith('.gif'):
                img_url = img['src']
                # Make sure it's an absolute URL
                if not img_url.startswith('http'):
                    img_url = 'https://www.wikiaves.com.br' + img_url
                return img_url
                
        print(f"No suitable image found on {url}")
        return None
        
    except Exception as e:
        print(f"Error fetching image URL from {url}: {str(e)}")
        return None

def update_bird_data_from_wikiaves():
    """
    Update the bird data JSON with image URLs from WikiAves
    """
    print("Starting update of bird data from WikiAves...")
    
    # Path to the Excel file and JSON file
    excel_path = "attached_assets/aves_Toca_v2.xlsx"
    json_path = "bird_data.json"
    
    # Check if files exist
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        return
    
    if not os.path.exists(json_path):
        print(f"Error: JSON file not found at {json_path}")
        return
    
    try:
        # Read the Excel file
        print(f"Reading Excel file from {excel_path}...")
        df = pd.read_excel(excel_path)
        
        # Load the existing JSON data
        print(f"Reading JSON file from {json_path}...")
        with open(json_path, 'r', encoding='utf-8') as f:
            bird_data = json.load(f)
        
        # Check available columns
        print(f"Available columns in Excel: {df.columns.tolist()}")
        
        # Create a dictionary of names to wikiaves URLs from Excel
        wikiaves_urls = {}
        for _, row in df.iterrows():
            name = row.get('Nome Comum', None)
            if name and 'link' in df.columns and not pd.isna(row['link']):
                wikiaves_urls[name] = str(row['link'])
        
        print(f"Found {len(wikiaves_urls)} birds with WikiAves links")
        
        # Get direct image URLs from WikiAves
        image_urls = {}
        for name, url in wikiaves_urls.items():
            print(f"Fetching image for {name} from {url}...")
            image_url = get_wikiaves_image_url(url)
            if image_url:
                image_urls[name] = image_url
                print(f"Found image URL: {image_url}")
            else:
                print(f"No image found for {name}")
            
            # Sleep between requests to be nice to the server
            time.sleep(random.uniform(1, 3))
        
        print(f"Found {len(image_urls)} direct image URLs")
        
        # Update the JSON data with new image URLs
        update_count = 0
        for bird in bird_data:
            if bird['name'] in image_urls:
                old_url = bird.get('imageUrl', '')
                new_url = image_urls[bird['name']]
                
                # Only update if the URL is actually different
                if old_url != new_url:
                    bird['imageUrl'] = new_url
                    update_count += 1
        
        print(f"Updated {update_count} birds with new image URLs")
        
        # Save the updated JSON data
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(bird_data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully updated JSON file at {json_path}")
        
    except Exception as e:
        print(f"Error updating bird data: {str(e)}")

if __name__ == "__main__":
    update_bird_data_from_wikiaves()