import { useEffect, memo, createElement, ComponentType } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
  propsHash: string;
}

class PerformanceProfiler {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observar Long Tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          }
        });
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }

      // Observar Layout Shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.value > 0.1) {
            console.warn(`Cumulative Layout Shift detected: ${entry.value}`, entry);
          }
        });
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        console.warn('Layout shift observer not supported');
      }
    }
  }

  startMeasure(componentName: string) {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${componentName}-start`);
    }
  }

  endMeasure(componentName: string, props?: any) {
    if (typeof window !== 'undefined' && window.performance) {
      const endMark = `${componentName}-end`;
      const measureName = `${componentName}-render`;

      performance.mark(endMark);
      performance.measure(measureName, `${componentName}-start`, endMark);

      const measure = performance.getEntriesByName(measureName)[0];
      if (measure) {
        const metric: PerformanceMetrics = {
          componentName,
          renderTime: measure.duration,
          timestamp: Date.now(),
          propsHash: props ? this.hashProps(props) : ''
        };

        this.metrics.push(metric);

        // Log performance issues
        if (measure.duration > 16) {
          console.warn(`Slow render detected for ${componentName}: ${measure.duration.toFixed(2)}ms`, props);
        }

        // Clean up marks
        performance.clearMarks(`${componentName}-start`);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
      }
    }
  }

  private hashProps(props: any): string {
    try {
      return JSON.stringify(props).slice(0, 100);
    } catch {
      return 'unhashable-props';
    }
  }

  getMetrics(componentName?: string): PerformanceMetrics[] {
    if (componentName) {
      return this.metrics.filter(m => m.componentName === componentName);
    }
    return this.metrics;
  }

  getComponentStats(componentName: string) {
    const componentMetrics = this.getMetrics(componentName);
    if (componentMetrics.length === 0) return null;

    const renderTimes = componentMetrics.map(m => m.renderTime);
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);

    return {
      componentName,
      totalRenders: componentMetrics.length,
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      minRenderTime: Number(minRenderTime.toFixed(2)),
      recentRenders: componentMetrics.slice(-10)
    };
  }

  getAllStats() {
    const componentNames = [...new Set(this.metrics.map(m => m.componentName))];
    return componentNames.map(name => this.getComponentStats(name)).filter(Boolean);
  }

  clearMetrics() {
    this.metrics = [];
  }

  getWebVitals() {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint')[0];

    return {
      // Core Web Vitals
      FCP: fcp ? Number(fcp.startTime.toFixed(2)) : null,
      LCP: lcp ? Number(lcp.startTime.toFixed(2)) : null,

      // Navigation timing
      domContentLoaded: navigation ? Number(navigation.domContentLoadedEventEnd.toFixed(2)) : null,
      loadComplete: navigation ? Number(navigation.loadEventEnd.toFixed(2)) : null,

      // Page performance
      totalBlockingTime: this.calculateTotalBlockingTime(),
      memoryUsage: this.getMemoryUsage()
    };
  }

  private calculateTotalBlockingTime(): number {
    const longTasks = performance.getEntriesByType('longtask');
    return longTasks.reduce((total: number, task: any) => {
      const blockingTime = Math.max(0, task.duration - 50);
      return total + blockingTime;
    }, 0);
  }

  private getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }

  generateReport() {
    const stats = this.getAllStats();
    const webVitals = this.getWebVitals();

    console.group('🚀 Performance Report');

    console.group('📊 Component Performance');
    stats.forEach(stat => {
      const emoji = stat!.avgRenderTime > 16 ? '🐌' : stat!.avgRenderTime > 8 ? '⚠️' : '✅';
      console.log(`${emoji} ${stat!.componentName}:`, {
        'Avg Render': `${stat!.avgRenderTime}ms`,
        'Max Render': `${stat!.maxRenderTime}ms`,
        'Total Renders': stat!.totalRenders
      });
    });
    console.groupEnd();

    if (webVitals) {
      console.group('🌐 Web Vitals');
      console.log('First Contentful Paint:', webVitals.FCP ? `${webVitals.FCP}ms` : 'N/A');
      console.log('Largest Contentful Paint:', webVitals.LCP ? `${webVitals.LCP}ms` : 'N/A');
      console.log('Total Blocking Time:', `${webVitals.totalBlockingTime.toFixed(2)}ms`);
      if (webVitals.memoryUsage) {
        console.log('Memory Usage:', `${webVitals.memoryUsage.used}MB / ${webVitals.memoryUsage.total}MB`);
      }
      console.groupEnd();
    }

    console.groupEnd();

    return { stats, webVitals };
  }

  dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

export const performanceProfiler = new PerformanceProfiler();

// Hook para usar em componentes React
export function usePerformanceProfiler(componentName: string, dependencies: any[] = []) {
  const depsString = JSON.stringify(dependencies);

  useEffect(() => {
    performanceProfiler.startMeasure(componentName);
    return () => {
      performanceProfiler.endMeasure(componentName, dependencies);
    };
  }, [componentName, depsString]);
}

// HOC para componentes
export function withPerformanceProfiler<T extends object>(
  WrappedComponent: any,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ProfiledComponent = memo((props: T) => {
    usePerformanceProfiler(displayName, [props]);
    return createElement(WrappedComponent, props);
  });

  ProfiledComponent.displayName = `withPerformanceProfiler(${displayName})`;

  return ProfiledComponent;
}

// Utilitário para debug global
if (typeof window !== 'undefined') {
  (window as any).performanceProfiler = performanceProfiler;
}