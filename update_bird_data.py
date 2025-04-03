import pandas as pd
import json
import os

def update_bird_data_from_excel():
    """
    Update the bird data JSON with image URLs from the Excel file
    """
    print("Starting update of bird data from Excel file...")
    
    # Path to the Excel file and JSON file
    excel_path = "attached_assets/aves_Toca_v2 (1).xlsx"
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
        
        # Create a dictionary of names to image URLs from Excel
        image_urls = {}
        for _, row in df.iterrows():
            name = row.get('Nome Comum', None)
            if name and 'Picture' in df.columns and pd.notna(row['Picture']):
                image_urls[name] = str(row['Picture'])
        
        print(f"Found {len(image_urls)} birds with image URLs")
        
        # Update the JSON data with new image URLs
        update_count = 0
        for bird in bird_data:
            if bird['name'] in image_urls:
                old_url = bird.get('imageUrl', '')
                new_url = image_urls[bird['name']]
                
                # Only update if the URL is actually different and not empty
                if old_url != new_url and new_url and not pd.isna(new_url):
                    bird['imageUrl'] = new_url
                    update_count += 1
                    print(f"Updated {bird['name']} with image URL: {new_url}")
        
        print(f"Updated {update_count} birds with new image URLs")
        
        # Save the updated JSON data
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(bird_data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully updated JSON file at {json_path}")
        
    except Exception as e:
        print(f"Error updating bird data: {str(e)}")

if __name__ == "__main__":
    update_bird_data_from_excel()