/**
 * Automated performance validation and monitoring system
 */

export interface PerformanceBudget {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  bundleSize: number; // Total bundle size (KB)
  chunkCount: number; // Maximum number of chunks
}

export interface ResponsiveValidationRule {
  breakpoint: string;
  minWidth: number;
  maxWidth?: number;
  requiredElements: string[];
  hiddenElements?: string[];
  layoutTests: Array<{
    selector: string;
    property: string;
    expectedValue: string | number;
    tolerance?: number;
  }>;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  issues: Array<{
    type: 'performance' | 'responsive' | 'accessibility';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    metric?: string;
    actual?: number;
    expected?: number;
    element?: string;
  }>;
  metrics: Record<string, number>;
  timestamp: number;
}

// Default performance budgets based on Core Web Vitals
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2500, // 2.5s for good LCP
  fid: 100,  // 100ms for good FID
  cls: 0.1,  // 0.1 for good CLS
  fcp: 1800, // 1.8s for good FCP
  ttfb: 800, // 800ms for good TTFB
  bundleSize: 1000, // 1MB total bundle size
  chunkCount: 10     // Maximum 10 chunks
};

// Responsive validation rules for different breakpoints
export const DEFAULT_RESPONSIVE_RULES: ResponsiveValidationRule[] = [
  {
    breakpoint: 'mobile',
    minWidth: 320,
    maxWidth: 767,
    requiredElements: [
      '[data-testid="mobile-menu"]',
      '[data-testid="chart-container"]'
    ],
    hiddenElements: [
      '[data-testid="desktop-sidebar"]'
    ],
    layoutTests: [
      {
        selector: '[data-testid="chart-container"]',
        property: 'width',
        expectedValue: '100%'
      }
    ]
  },
  {
    breakpoint: 'tablet',
    minWidth: 768,
    maxWidth: 1023,
    requiredElements: [
      '[data-testid="chart-container"]',
      '[data-testid="sidebar"]'
    ],
    layoutTests: [
      {
        selector: '[data-testid="chart-grid"]',
        property: 'gridTemplateColumns',
        expectedValue: 'repeat(2, 1fr)'
      }
    ]
  },
  {
    breakpoint: 'desktop',
    minWidth: 1024,
    requiredElements: [
      '[data-testid="chart-container"]',
      '[data-testid="sidebar"]',
      '[data-testid="chart-grid"]'
    ],
    layoutTests: [
      {
        selector: '[data-testid="chart-grid"]',
        property: 'gridTemplateColumns',
        expectedValue: 'repeat(3, 1fr)'
      }
    ]
  }
];

class PerformanceValidator {
  private budget: PerformanceBudget;
  private responsiveRules: ResponsiveValidationRule[];
  private observer: PerformanceObserver | null = null;
  private metrics: Map<string, number> = new Map();

  constructor(
    budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET,
    responsiveRules: ResponsiveValidationRule[] = DEFAULT_RESPONSIVE_RULES
  ) {
    this.budget = budget;
    this.responsiveRules = responsiveRules;
  }

  /**
   * Start continuous performance monitoring
   */
  startMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not available');
      return;
    }

    // Monitor Core Web Vitals
    this.monitorWebVitals();

    // Monitor resource loading
    this.monitorResourceTiming();

    // Monitor layout shifts
    this.monitorLayoutShifts();

    // Monitor long tasks
    this.monitorLongTasks();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Validate current performance against budget
   */
  async validatePerformance(): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const metrics: Record<string, number> = {};

    // Get current navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      // Calculate FCP
      const fcp = this.metrics.get('fcp') || 0;
      metrics.fcp = fcp;
      if (fcp > this.budget.fcp) {
        issues.push({
          type: 'performance',
          severity: 'critical',
          message: `First Contentful Paint (${fcp}ms) exceeds budget (${this.budget.fcp}ms)`,
          metric: 'fcp',
          actual: fcp,
          expected: this.budget.fcp
        });
      }

      // Calculate LCP
      const lcp = this.metrics.get('lcp') || 0;
      metrics.lcp = lcp;
      if (lcp > this.budget.lcp) {
        issues.push({
          type: 'performance',
          severity: 'critical',
          message: `Largest Contentful Paint (${lcp}ms) exceeds budget (${this.budget.lcp}ms)`,
          metric: 'lcp',
          actual: lcp,
          expected: this.budget.lcp
        });
      }

      // Calculate FID
      const fid = this.metrics.get('fid') || 0;
      metrics.fid = fid;
      if (fid > this.budget.fid) {
        issues.push({
          type: 'performance',
          severity: 'warning',
          message: `First Input Delay (${fid}ms) exceeds budget (${this.budget.fid}ms)`,
          metric: 'fid',
          actual: fid,
          expected: this.budget.fid
        });
      }

      // Calculate CLS
      const cls = this.metrics.get('cls') || 0;
      metrics.cls = cls;
      if (cls > this.budget.cls) {
        issues.push({
          type: 'performance',
          severity: 'warning',
          message: `Cumulative Layout Shift (${cls.toFixed(3)}) exceeds budget (${this.budget.cls})`,
          metric: 'cls',
          actual: cls,
          expected: this.budget.cls
        });
      }

      // Calculate TTFB
      const ttfb = navigation.responseStart - navigation.requestStart;
      metrics.ttfb = ttfb;
      if (ttfb > this.budget.ttfb) {
        issues.push({
          type: 'performance',
          severity: 'warning',
          message: `Time to First Byte (${ttfb}ms) exceeds budget (${this.budget.ttfb}ms)`,
          metric: 'ttfb',
          actual: ttfb,
          expected: this.budget.ttfb
        });
      }
    }

    // Validate bundle size (would need to be checked during build)
    const bundleSize = this.estimateBundleSize();
    metrics.bundleSize = bundleSize;
    if (bundleSize > this.budget.bundleSize) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: `Estimated bundle size (${bundleSize}KB) exceeds budget (${this.budget.bundleSize}KB)`,
        metric: 'bundleSize',
        actual: bundleSize,
        expected: this.budget.bundleSize
      });
    }

    const score = this.calculatePerformanceScore(issues);

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      score,
      issues,
      metrics,
      timestamp: Date.now()
    };
  }

  /**
   * Validate responsive design at current viewport
   */
  async validateResponsive(): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const metrics: Record<string, number> = {};

    const viewportWidth = window.innerWidth;
    metrics.viewportWidth = viewportWidth;

    // Find applicable rule for current viewport
    const applicableRule = this.responsiveRules.find(rule =>
      viewportWidth >= rule.minWidth &&
      (rule.maxWidth === undefined || viewportWidth <= rule.maxWidth)
    );

    if (!applicableRule) {
      issues.push({
        type: 'responsive',
        severity: 'warning',
        message: `No responsive rule defined for viewport width ${viewportWidth}px`
      });
    } else {
      // Check required elements are visible
      for (const selector of applicableRule.requiredElements) {
        const element = document.querySelector(selector);
        if (!element) {
          issues.push({
            type: 'responsive',
            severity: 'critical',
            message: `Required element not found: ${selector}`,
            element: selector
          });
        } else {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            issues.push({
              type: 'responsive',
              severity: 'warning',
              message: `Required element has zero dimensions: ${selector}`,
              element: selector
            });
          }
        }
      }

      // Check hidden elements are actually hidden
      if (applicableRule.hiddenElements) {
        for (const selector of applicableRule.hiddenElements) {
          const element = document.querySelector(selector);
          if (element) {
            const computedStyle = getComputedStyle(element);
            if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
              issues.push({
                type: 'responsive',
                severity: 'warning',
                message: `Element should be hidden at this breakpoint: ${selector}`,
                element: selector
              });
            }
          }
        }
      }

      // Run layout tests
      for (const test of applicableRule.layoutTests) {
        const element = document.querySelector(test.selector);
        if (element) {
          const computedStyle = getComputedStyle(element);
          const actualValue = computedStyle.getPropertyValue(test.property);

          if (actualValue !== test.expectedValue) {
            issues.push({
              type: 'responsive',
              severity: 'warning',
              message: `Layout test failed for ${test.selector}: ${test.property} = "${actualValue}", expected "${test.expectedValue}"`,
              element: test.selector
            });
          }
        }
      }
    }

    const score = this.calculateResponsiveScore(issues);

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      score,
      issues,
      metrics,
      timestamp: Date.now()
    };
  }

  /**
   * Run comprehensive validation (performance + responsive)
   */
  async validateAll(): Promise<ValidationResult> {
    const [perfResult, respResult] = await Promise.all([
      this.validatePerformance(),
      this.validateResponsive()
    ]);

    const allIssues = [...perfResult.issues, ...respResult.issues];
    const allMetrics = { ...perfResult.metrics, ...respResult.metrics };
    const overallScore = (perfResult.score + respResult.score) / 2;

    return {
      passed: perfResult.passed && respResult.passed,
      score: overallScore,
      issues: allIssues,
      metrics: allMetrics,
      timestamp: Date.now()
    };
  }

  private monitorWebVitals(): void {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('fcp', lastEntry.startTime);
    }).observe({ type: 'paint', buffered: true });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.set('lcp', lastEntry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.set('fid', entry.processingStart - entry.startTime);
      });
    }).observe({ type: 'first-input', buffered: true });
  }

  private monitorResourceTiming(): void {
    new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      entries.forEach(entry => {
        if (entry.initiatorType === 'script' && entry.name.includes('chunk')) {
          console.debug(`Chunk loaded: ${entry.name} in ${entry.duration}ms`);
        }
      });
    }).observe({ type: 'resource', buffered: true });
  }

  private monitorLayoutShifts(): void {
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.set('cls', clsValue);
    }).observe({ type: 'layout-shift', buffered: true });
  }

  private monitorLongTasks(): void {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.duration > 50) {
          console.warn(`Long task detected: ${entry.duration}ms`);
        }
      });
    }).observe({ type: 'longtask', buffered: true });
  }

  private estimateBundleSize(): number {
    // Estimate based on loaded resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r =>
      r.initiatorType === 'script' && r.name.includes('assets/js')
    );

    return jsResources.reduce((total, resource) => {
      // Estimate size from transfer size or duration
      return total + (resource.transferSize || resource.duration * 10);
    }, 0) / 1024; // Convert to KB
  }

  private calculatePerformanceScore(issues: ValidationResult['issues']): number {
    let score = 100;
    issues.forEach(issue => {
      if (issue.type === 'performance') {
        switch (issue.severity) {
          case 'critical':
            score -= 25;
            break;
          case 'warning':
            score -= 10;
            break;
          case 'info':
            score -= 5;
            break;
        }
      }
    });
    return Math.max(0, score);
  }

  private calculateResponsiveScore(issues: ValidationResult['issues']): number {
    let score = 100;
    issues.forEach(issue => {
      if (issue.type === 'responsive') {
        switch (issue.severity) {
          case 'critical':
            score -= 20;
            break;
          case 'warning':
            score -= 10;
            break;
          case 'info':
            score -= 5;
            break;
        }
      }
    });
    return Math.max(0, score);
  }
}

// Export singleton instance
export const performanceValidator = new PerformanceValidator();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  performanceValidator.startMonitoring();
}