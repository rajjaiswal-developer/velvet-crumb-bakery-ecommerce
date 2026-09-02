/**
 * Safely extracts an array of image URL strings from product image data
 * (handling string arrays, object arrays [{url, fileId}], null/undefined, and empty states).
 */
export function getProductImages(images: unknown): string[] {
  if (!Array.isArray(images) || images.length === 0) {
    return ['/placeholder-cake.jpg'];
  }

  const urls = images
    .map((img) => (typeof img === 'string' ? img : (img as { url?: string })?.url || ''))
    .filter(Boolean);

  return urls.length > 0 ? urls : ['/placeholder-cake.jpg'];
}

/**
 * Safely extracts the primary image URL string for a product.
 */
export function getFirstProductImage(images: unknown): string {
  return getProductImages(images)[0];
}

/**
 * Utility helper to apply ImageKit transformation parameters to an image URL.
 * Supports width, height, quality, and automatic format conversion.
 */
export function getOptimizedImageUrl(
  srcUrl: string | undefined | null,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!srcUrl) return '/placeholder-cake.jpg';

  // If it's a local placeholder or non-ImageKit URL, return as-is
  if (srcUrl.startsWith('/') || !srcUrl.includes('imagekit.io')) {
    return srcUrl;
  }

  const { width, height, quality = 80 } = options;
  const transforms: string[] = [`q-${quality}`, 'f-auto'];

  if (width) transforms.push(`w-${width}`);
  if (height) transforms.push(`h-${height}`);

  const trParam = `tr=${transforms.join(',')}`;
  const separator = srcUrl.includes('?') ? '&' : '?';

  return `${srcUrl}${separator}${trParam}`;
}

