import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { InsertBird, Bird } from '@shared/schema';

export function readBirdsFromExcel(): InsertBird[] {
  try {
    console.log('Attempting to read Excel file...');
    // Check if file exists first
    const filePath = path.resolve('attached_assets/aves_Toca_v2.xlsx');
    if (!fs.existsSync(filePath)) {
      console.error(`Excel file not found at path: ${filePath}`);
      return [];
    }
    
    console.log(`Excel file found at: ${filePath}`);
    
    // Read the file
    const workbook = XLSX.readFile(filePath);
    console.log(`Workbook loaded. Available sheets: ${workbook.SheetNames.join(', ')}`);
    
    if (workbook.SheetNames.length === 0) {
      console.error('No sheets found in the Excel file');
      return [];
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('Excel data read successfully:', data.length, 'rows');
    
    // Log the structure of the first row to help with mapping
    if (data.length > 0) {
      console.log('First row structure:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Excel file is empty or could not be parsed correctly');
      return [];
    }
    
    // Map the Excel data to our Bird schema
    const birds: InsertBird[] = data.map((row: any, index) => {
      console.log(`Processing row ${index + 1}:`, JSON.stringify(row, null, 2));
      
      // Default mapping - adjust field names based on your Excel structure
      const bird: InsertBird = {
        name: row['Nome'] || row['Nome Comum'] || row['name'] || '',
        scientificName: row['Nome Científico'] || row['Scientific Name'] || row['scientificName'] || '',
        family: row['Família'] || row['Family'] || row['family'] || null,
        habitat: row['Habitat'] || row['habitat'] || null,
        diet: row['Alimentação'] || row['Diet'] || row['diet'] || null,
        conservationStatus: row['Nível ameaça'] || row['Conservation Status'] || row['conservationStatus'] || null,
        description: row['Características'] || row['Description'] || row['description'] || null,
        wikipediaUrl: row['Wikipedia'] || row['wikipediaUrl'] || null,
        imageUrl: row['Imagem'] || row['Image URL'] || row['imageUrl'] || null,
        category: row['Categoria'] || row['Category'] || row['category'] || 'common',
      };
      
      // Ensure name and scientificName are not empty
      if (!bird.name || !bird.scientificName) {
        console.warn(`Row ${index + 1} is missing required name or scientificName:`, row);
      }
      
      return bird;
    });
    
    console.log(`Processed ${birds.length} birds from Excel`);
    return birds;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    return [];
  }
}