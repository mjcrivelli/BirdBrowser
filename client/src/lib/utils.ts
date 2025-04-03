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

  // Handle Special:FilePath URLs
  if (url.includes('Special:FilePath')) {
    // Extract the filename from the URL
    const filename = url.split('/').pop() || '';
    // Use the Wikimedia API to get a direct URL
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
  }

  // If it's already a direct Wikimedia Commons URL, just return it
  if (url.includes('upload.wikimedia.org')) {
    // Modify URL to get a larger version by removing size constraints
    if (url.includes('/thumb/')) {
      // Remove the thumb part and the dimension specification at the end
      const parts = url.split('/');
      const filenameParts = parts[parts.length - 1].split('px-');
      if (filenameParts.length > 1) {
        parts.splice(parts.length - 1, 1, filenameParts[1]); // Replace the filename with one without size
        parts.splice(parts.indexOf('thumb'), 1); // Remove 'thumb' from the path
        return parts.join('/');
      }
    }
    return url;
  }

  // Extract filename for other Commons URLs
  if (url.includes('commons.wikimedia.org/wiki/File:')) {
    const filename = url.split(':').pop() || '';
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(filename)}&width=500`;
  }

  // Handle WikiAves URLs
  if (url.includes('wikiaves.com.br')) {
    return url;
  }

  // Cleanup any malformed URLs
  if (url.includes('/')) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Remove any duplicate filename at the end
    if (url.endsWith('/' + filename + '/' + filename)) {
      return url.substring(0, url.lastIndexOf('/'));
    }
  }

  // Default fallback to the original URL
  return url;
}