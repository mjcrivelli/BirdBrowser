import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { BirdWithSeenStatus } from '@shared/schema';

/**
 * Generate a PDF of the birds that the user has seen
 * @param seenBirds The list of birds that the user has seen
 */
export const generateBirdsPDF = async (seenBirds: BirdWithSeenStatus[]): Promise<void> => {
  if (seenBirds.length === 0) {
    alert('Você ainda não marcou nenhuma ave como vista!');
    return;
  }

  // Create a temporary container to render the PDF content
  const tempContainer = document.createElement('div');
  tempContainer.classList.add('pdf-container');
  tempContainer.style.padding = '20px';
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.width = '800px';
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  document.body.appendChild(tempContainer);

  // Add the header
  const header = document.createElement('div');
  header.classList.add('pdf-header');
  header.style.textAlign = 'center';
  header.style.marginBottom = '20px';
  
  const title = document.createElement('h1');
  title.textContent = 'As aves que vi na Cachoeira da Toca!';
  title.style.color = '#4CAF50';
  title.style.fontFamily = 'Arial, sans-serif';
  title.style.marginBottom = '10px';
  
  const date = document.createElement('p');
  date.textContent = new Date().toLocaleDateString('pt-BR');
  date.style.fontSize = '14px';
  date.style.color = '#666';
  
  header.appendChild(title);
  header.appendChild(date);
  tempContainer.appendChild(header);

  // Add the bird cards
  const birdsContainer = document.createElement('div');
  birdsContainer.style.display = 'flex';
  birdsContainer.style.flexDirection = 'column';
  birdsContainer.style.gap = '20px';

  // Create and add each bird card
  for (const bird of seenBirds) {
    const birdCard = document.createElement('div');
    birdCard.style.border = '1px solid #4CAF50';
    birdCard.style.borderRadius = '8px';
    birdCard.style.padding = '15px';
    birdCard.style.display = 'flex';
    birdCard.style.gap = '20px';

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.style.width = '150px';
    imageContainer.style.height = '150px';
    imageContainer.style.overflow = 'hidden';
    imageContainer.style.borderRadius = '50%';
    imageContainer.style.flexShrink = '0';

    const image = document.createElement('img');
    // Handle protocol-relative URLs
    image.src = bird.imageUrl && bird.imageUrl.startsWith('//') 
      ? `https:${bird.imageUrl}` 
      : bird.imageUrl;
    image.alt = bird.name;
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    imageContainer.appendChild(image);

    // Bird info
    const birdInfo = document.createElement('div');
    birdInfo.style.flex = '1';

    const birdName = document.createElement('h2');
    birdName.textContent = bird.name;
    birdName.style.color = '#333';
    birdName.style.marginBottom = '5px';
    birdName.style.fontFamily = 'Arial, sans-serif';

    const scientificName = document.createElement('p');
    scientificName.textContent = bird.scientificName;
    scientificName.style.fontStyle = 'italic';
    scientificName.style.color = '#666';
    scientificName.style.marginBottom = '10px';

    const description = document.createElement('p');
    description.textContent = bird.description || 'Sem descrição disponível.';
    description.style.fontSize = '14px';
    description.style.marginBottom = '5px';

    const habitat = document.createElement('p');
    habitat.textContent = `Habitat: ${bird.habitat || 'Não especificado'}`;
    habitat.style.fontSize = '14px';
    habitat.style.marginBottom = '5px';

    const diet = document.createElement('p');
    diet.textContent = `Dieta: ${bird.diet || 'Não especificada'}`;
    diet.style.fontSize = '14px';

    birdInfo.appendChild(birdName);
    birdInfo.appendChild(scientificName);
    birdInfo.appendChild(description);
    birdInfo.appendChild(habitat);
    birdInfo.appendChild(diet);

    birdCard.appendChild(imageContainer);
    birdCard.appendChild(birdInfo);
    birdsContainer.appendChild(birdCard);
  }

  tempContainer.appendChild(birdsContainer);

  try {
    // Use html2canvas to capture the content
    const canvas = await html2canvas(tempContainer, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    // Calculate proper sizing to fit on A4
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let position = 0;
    
    // Add the image to the PDF
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    
    // If the content is taller than a single page, add more pages
    let heightLeft = imgHeight;
    
    while (heightLeft > 297) { // A4 height in mm
      position = -297;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
      position -= 297;
    }

    // Save the PDF
    pdf.save('aves-vistas-toca.pdf');
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
  } finally {
    // Clean up the temporary element
    document.body.removeChild(tempContainer);
  }
};