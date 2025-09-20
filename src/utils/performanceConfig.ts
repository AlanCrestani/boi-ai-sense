/**
 * Performance optimization configuration and utilities
 */

import { ImagePerformanceObserver } from './imageOptimization';

export interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableServiceWorker: boolean;
  enableImageOptimization: boolean;
  enablePerformanceMonitoring: boolean;
  chunkLoadingTimeout: number;
  resourceHints: boolean;
}

// Default performance configuration
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableLazyLoading: true,
  enableServiceWorker: true,
  enableImageOptimization: true,
  enablePerformanceMonitoring: false, // Desabilitado para evitar logs excessivos
  chunkLoadingTimeout: 30000, // 30 seconds
  resourceHints: true,
};

class PerformanceManager {
  private config: PerformanceConfig;
  private imageObserver: ImagePerformanceObserver | null = null;

  constructor(config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG) {
    this.config = config;
  }

  /**
   * Initialize performance optimizations
   */
  init(): void {
    if (this.config.enablePerformanceMonitoring) {
      this.initPerformanceMonitoring();
    }

    if (this.config.resourceHints) {
      this.addResourceHints();
    }

    // Critical path CSS optimization
    this.optimizeCriticalPath();

    // Prefetch critical resources
    this.prefetchCriticalResources();
  }

  /**
   * Initialize performance monitoring
   */
  private initPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        // console.debug('LCP:', lastEntry.startTime); // Comentado para reduzir logs
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          // console.debug('FID:', entry.processingStart - entry.startTime); // Comentado para reduzir logs
        });
      }).observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift (CLS)
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        // console.debug('CLS:', clsValue); // Comentado para reduzir logs
      }).observe({ type: 'layout-shift', buffered: true });
    }

    // Image loading performance
    if (this.config.enableImageOptimization) {
      this.imageObserver = new ImagePerformanceObserver();
      this.imageObserver.start();
    }

    // Long task monitoring
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 100) { // Aumentado threshold para 100ms
            console.debug('Long task detected:', entry.duration, 'ms'); // Mudado de warn para debug
          }
        });
      }).observe({ type: 'longtask', buffered: true });
    }
  }

  /**
   * Add resource hints to improve loading
   */
  private addResourceHints(): void {
    if (typeof document === 'undefined') return;

    const resourceHints = [
      // DNS prefetch for external domains
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
      { rel: 'dns-prefetch', href: '//cdn.jsdelivr.net' },

      // Preconnect for critical external resources
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
    ];

    resourceHints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) {
        link.crossOrigin = 'anonymous';
      }

      // Avoid duplicates
      if (!document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)) {
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Optimize critical rendering path
   */
  private optimizeCriticalPath(): void {
    if (typeof document === 'undefined') return;

    // Add critical CSS loading hint
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    styles.forEach(style => {
      const link = style as HTMLLinkElement;
      if (link.href.includes('fonts.googleapis.com')) {
        link.setAttribute('media', 'print');
        link.setAttribute('onload', "this.media='all'");
      }
    });
  }

  /**
   * Prefetch critical resources for next navigation
   */
  private prefetchCriticalResources(): void {
    if (typeof document === 'undefined' || !('requestIdleCallback' in window)) return;

    requestIdleCallback(() => {
      const criticalRoutes = ['/dashboard', '/analytics', '/csv-upload'];

      criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    });
  }

  /**
   * Monitor and report performance metrics
   */
  getPerformanceMetrics(): Record<string, number> {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return {};
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    return {
      // Loading metrics
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,

      // Network metrics
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,

      // Processing metrics
      domProcessing: navigation.domComplete - navigation.domLoading,

      // Total time
      totalTime: navigation.loadEventEnd - navigation.navigationStart,
    };
  }

  /**
   * Clean up performance monitoring
   */
  cleanup(): void {
    if (this.imageObserver) {
      this.imageObserver.stop();
    }
  }
}

// Export singleton instance
export const performanceManager = new PerformanceManager();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceManager.init();
    });
  } else {
    performanceManager.init();
  }
}