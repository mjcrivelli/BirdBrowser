import json

def fix_problem_birds():
    """
    Fix specific birds with problematic image URLs
    """
    print("Fixing problematic bird image URLs...")
    
    # Path to the JSON file
    json_path = "bird_data.json"
    
    try:
        # Load the existing JSON data
        with open(json_path, 'r', encoding='utf-8') as f:
            bird_data = json.load(f)
        
        # Hardcoded image URLs for known problematic birds
        # These are direct URLs to high-quality images for each bird
        problem_birds = {
            "Saíra-sete-cores": "https://s3.amazonaws.com/media.wikiaves.com.br/images/5195/1649395_7d9fa3af51e7b71d5a1a96eb61d4eb64.jpg",
            "Saíra-militar": "https://s3.amazonaws.com/media.wikiaves.com.br/images/9023/2290326_5dbe64d37dfa518a4775f53c42d3b8f7.jpg",
            "Saí-verde": "https://s3.amazonaws.com/media.wikiaves.com.br/images/8422/2248061_2ba255b7f01a9827a819eab2c40ae7ec.jpg",
            "Saí-azul": "https://s3.amazonaws.com/media.wikiaves.com.br/images/7012/2141274_7cc4be76f7ec7d0f7ce14e71f8b5ffad.jpg",
            "Sanhaço-do-coqueiro": "https://s3.amazonaws.com/media.wikiaves.com.br/images/7399/1869991_45a2d2f2a06ecf09a4cee7dfd3c3fcbe.jpg",
            "Capitão-de-saíra": "https://s3.amazonaws.com/media.wikiaves.com.br/images/6591/1919918_00aa2d0bd6c6fe31d0a5ac44b90ad532.jpg",
            "Tiê-preto": "https://s3.amazonaws.com/media.wikiaves.com.br/images/6423/2162320_cd5acaa2d3bff8d5d85dc9b027aa85ad.jpg",
            "Gavião-pombo-pequeno": "https://s3.amazonaws.com/media.wikiaves.com.br/images/6819/1701988_80c20cf1e81d9d74dbd7f8e55c3deec2.jpg"
        }
        
        # Update the JSON data with the hardcoded image URLs
        update_count = 0
        for bird in bird_data:
            if bird['name'] in problem_birds:
                old_url = bird.get('imageUrl', '')
                new_url = problem_birds[bird['name']]
                
                # Only update if the URL is actually different
                if old_url != new_url:
                    bird['imageUrl'] = new_url
                    update_count += 1
                    print(f"Updated {bird['name']} with new image URL: {new_url}")
        
        print(f"Updated {update_count} birds with new image URLs")
        
        # Save the updated JSON data
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(bird_data, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully updated JSON file at {json_path}")
        
    except Exception as e:
        print(f"Error fixing problematic birds: {str(e)}")

if __name__ == "__main__":
    fix_problem_birds()