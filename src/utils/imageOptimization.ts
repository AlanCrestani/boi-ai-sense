/**
 * Image optimization utilities for better performance
 */

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fallback?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Checks if the browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Creates optimized image source based on browser capabilities
 */
export async function getOptimizedImageSrc(
  originalSrc: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const { quality = 85, format = 'webp', fallback } = options;

  const webpSupported = await supportsWebP();

  if (!webpSupported) {
    return fallback || originalSrc;
  }

  // For now, return original src since we don't have a conversion service
  // In production, this would integrate with an image CDN like Cloudinary
  return originalSrc;
}

/**
 * Preloads critical images for better perceived performance
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;

  if (priority === 'high') {
    link.setAttribute('fetchpriority', 'high');
  }

  document.head.appendChild(link);
}

/**
 * Creates responsive image srcset for different screen densities
 */
export function createSrcSet(baseSrc: string, densities: number[] = [1, 2]): string {
  return densities
    .map(density => {
      const src = baseSrc.replace(/\.(jpg|jpeg|png|webp)$/i, `@${density}x.$1`);
      return `${src} ${density}x`;
    })
    .join(', ');
}

/**
 * Generates sizes attribute for responsive images
 */
export function generateSizes(breakpoints: Array<{ minWidth: string; width: string }>): string {
  return breakpoints
    .map(bp => `(min-width: ${bp.minWidth}) ${bp.width}`)
    .join(', ');
}

/**
 * Image loading performance observer
 */
export class ImagePerformanceObserver {
  private observer: PerformanceObserver | null = null;

  constructor() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        entries.forEach(entry => {
          if (entry.initiatorType === 'img') {
            console.debug(`Image loaded: ${entry.name} in ${entry.duration}ms`);
          }
        });
      });
    }
  }

  start() {
    if (this.observer) {
      this.observer.observe({ type: 'resource', buffered: true });
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}