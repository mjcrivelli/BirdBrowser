import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Wikipedia image URL to a direct URL for the Wikimedia Commons image
 * Works with both Special:FilePath and direct Commons URLs
 */
export function getWikipediaImageUrl(url: string): string {
  if (!url) return '';
  
  // Handle Special:FilePath URLs
  if (url.includes('Special:FilePath')) {
    // Extract the filename from the URL
    const filename = url.split('/').pop() || '';
    // Use the Wikimedia API to get a direct URL
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
  }
  
  // If it's already a direct Wikimedia Commons URL, just return it
  if (url.includes('upload.wikimedia.org')) {
    return url;
  }
  
  // Extract filename for other Commons URLs
  if (url.includes('commons.wikimedia.org/wiki/File:')) {
    const filename = url.split(':').pop() || '';
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
  }
  
  // Default fallback to the original URL
  return url;
}
