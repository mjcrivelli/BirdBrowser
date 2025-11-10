import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Announce a message to screen readers using the global live region.
 */
export function announce(message: string) {
  try {
    const region = document.getElementById('a11y-live-region');
    if (!region) return;
    // Clear first to ensure change is detected
    region.textContent = '';
    // Slight delay to reliably trigger aria-live
    window.setTimeout(() => {
      region.textContent = message;
    }, 50);
  } catch {
    // no-op
  }
}

/**
 * Converts a Wikipedia image URL to a direct URL for the Wikimedia Commons image
 * Works with various Wikipedia/Wikimedia URL formats
 */
export function getWikipediaImageUrl(url: string): string {
  if (!url) return '';

  // Use direct URLs from the Excel file's "Picture" column if available
  // WikiAves URLs - these are direct image URLs
  if (url.includes('wikiaves.com.br')) {
    return url;
  }

  // Handle URLs that start with // (protocol-relative URLs)
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }

  // Fix malformed URLs with duplicate filenames (common pattern in our dataset)
  // Example: https://upload.wikimedia.org/wikipedia/commons/f/f8/Dacnis_cayana.jpg/Dacnis_cayana.jpg
  const filenameMatch = url.match(/([^\/]+\.(jpg|png|jpeg|gif|svg))\/([^\/]+\.(jpg|png|jpeg|gif|svg))$/i);
  if (filenameMatch && filenameMatch[1] === filenameMatch[3]) {
    url = url.substring(0, url.lastIndexOf('/'));
  }

  // If we already have a Special:Redirect URL, just adjust the width parameter
  if (url.includes('Special:Redirect/file/')) {
    // Return with increased width for better quality
    const urlParts = url.split('width=');
    if (urlParts.length > 1) {
      return urlParts[0] + 'width=500';
    }
    return url;
  }

  // Extract filename for Special:FilePath URLs
  if (url.includes('Special:FilePath')) {
    const filename = url.split('/').pop() || '';
    // Decode the filename which may be URL encoded
    const decodedFilename = decodeURIComponent(filename);
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(decodedFilename)}&width=500`;
  }

  // Handle direct Wikimedia Commons upload URLs
  if (url.includes('upload.wikimedia.org')) {
    // For the specific URLs from our Excel - extract just the filename
    const parts = url.split('/');
    // Get the last non-empty part (filename)
    let filename = '';
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] && /\.(jpg|png|jpeg|gif|svg)$/i.test(parts[i])) {
        filename = parts[i];
        break;
      }
    }

    if (filename) {
      return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
    }
    return url;
  }

  // Extract filename for Commons File: URLs
  if (url.includes('commons.wikimedia.org/wiki/File:')) {
    const parts = url.split('File:');
    if (parts.length > 1) {
      const filename = parts[1].split('#')[0].split('?')[0]; // Remove any hash or query params
      return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
    }
  }

  // Handle 280px and similar prefixes in URL filename
  if (url.includes('/280px-') || url.includes('/330px-') || url.includes('/250px-')) {
    const parts = url.split('/');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes('px-')) {
        const filename = parts[i].replace(/^\d+px-/, ''); // Remove the pixel prefix
        return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
      }
    }
  }

  // For any non-recognized URL format, extract filename and use Commons redirect API
  const lastSegment = url.split('/').pop();
  if (lastSegment && /\.(jpg|png|jpeg|gif|svg)$/i.test(lastSegment)) {
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(lastSegment)}&width=500`;
  }

  // Handle remaining problematic birds with hardcoded high-quality WikiAves URLs
  const birdNames: Record<string, string> = {
    "Saí-verde": "https://www.wikiaves.com.br/img/fotocapa/_114177.jpg",
    "Saí-azul": "https://www.wikiaves.com.br/img/fotocapa/_66254.jpg",
    "Saíra-sete-cores": "https://www.wikiaves.com.br/img/fotocapa/_97262.jpg",
    "Capitão-de-saíra": "https://www.wikiaves.com.br/img/fotocapa/_92456.jpg",
    "Saíra-militar": "https://www.wikiaves.com.br/img/fotocapa/_105249.jpg",
    "Sanhaço-do-coqueiro": "https://www.wikiaves.com.br/img/fotocapa/_234168.jpg",
    "Tiê-preto": "https://www.wikiaves.com.br/img/fotocapa/_93389.jpg",
    "Sanhaço-cinzento": "https://www.wikiaves.com.br/img/fotocapa/_66158.jpg",
    "Alma-de-gato": "https://www.wikiaves.com.br/img/fotocapa/_112310.jpg",
    "Tico-tico": "https://www.wikiaves.com.br/img/fotocapa/_190063.jpg",
    "Sabiá-poca": "https://www.wikiaves.com.br/img/fotocapa/_66118.jpg",
    "Sabiá-una": "https://www.wikiaves.com.br/img/fotocapa/_111834.jpg",
    "Periquito-rico": "https://www.wikiaves.com.br/img/fotocapa/_115003.jpg",
    "Sanhaço-de-encontro-azul": "https://www.wikiaves.com.br/img/fotocapa/_93341.jpg",
    "Sanhaço-de-encontro-amarelo": "https://www.wikiaves.com.br/img/fotocapa/_66187.jpg",
    "Tiê-de-topete": "https://www.wikiaves.com.br/img/fotocapa/_93379.jpg",
    "Surucuá-de-barriga-amarela": "https://www.wikiaves.com.br/img/fotocapa/_66149.jpg",
    "Gaturamo-rei": "https://www.wikiaves.com.br/img/fotocapa/_93316.jpg",
    "Tangará": "https://www.wikiaves.com.br/img/fotocapa/_93450.jpg",
    "Viuvinha": "https://www.wikiaves.com.br/img/fotocapa/_119772.jpg",
    "Tiê-de-bando": "https://www.wikiaves.com.br/img/fotocapa/_93373.jpg",
    "Ferro-velho": "https://www.wikiaves.com.br/img/fotocapa/_66261.jpg",
    "Bico-de-lacre": "https://www.wikiaves.com.br/img/fotocapa/_93409.jpg",
    "Catirumbava": "https://www.wikiaves.com.br/img/fotocapa/_97213.jpg",
    "Tiê-sangue": "https://www.wikiaves.com.br/img/fotocapa/_66209.jpg"
  };

  // Check if the URL contains any of the birds we're applying hardcoded images for
  for (const birdName in birdNames) {
    if (url.toLowerCase().includes(birdName.toLowerCase())) {
      return birdNames[birdName];
    }
  }

  // Default fallback - use URL as is
  return url;
}
