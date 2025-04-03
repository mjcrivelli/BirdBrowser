import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Wikipedia image URL to a direct URL for the Wikimedia Commons image
 * Works with various Wikipedia/Wikimedia URL formats
 */
export function getWikipediaImageUrl(url: string): string {
  if (!url) return '';
  
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

  // Handle Special:FilePath URLs
  if (url.includes('Special:FilePath')) {
    // Extract the filename from the URL
    const filename = url.split('/').pop() || '';
    // Use the Wikimedia API to get a direct URL
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
  }
  
  // Handle direct Wikimedia Commons URLs
  if (url.includes('upload.wikimedia.org')) {
    // For the specific URLs from our Excel - extract just the filename
    const filename = url.split('/').pop() || '';
    if (filename) {
      return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
    }
    return url;
  }
  
  // Extract filename for other Commons URLs
  if (url.includes('commons.wikimedia.org/wiki/File:')) {
    const filename = url.split(':').pop() || '';
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
  }
  
  // Handle WikiAves URLs - direct return
  if (url.includes('wikiaves.com.br')) {
    return url;
  }
  
  // For any non-recognized URL format, extract filename and use Commons redirect API
  const lastSegment = url.split('/').pop();
  if (lastSegment && /\.(jpg|png|jpeg|gif|svg)$/i.test(lastSegment)) {
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(lastSegment)}&width=500`;
  }
  
  // Default fallback - use URL as is
  return url;
}