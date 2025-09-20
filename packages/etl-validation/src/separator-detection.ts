/**
 * Automatic CSV separator detection
 * Analyzes first N lines to determine the most likely delimiter
 */

export type CsvSeparator = ',' | ';' | '\t' | '|';

export interface SeparatorDetectionResult {
  separator: CsvSeparator;
  confidence: number;
  analysis: {
    [key in CsvSeparator]: {
      count: number;
      consistency: number;
      score: number;
    };
  };
}

export interface SeparatorDetectionOptions {
  sampleLines?: number;
  minConfidence?: number;
  fallbackSeparator?: CsvSeparator;
}

const DEFAULT_OPTIONS: Required<SeparatorDetectionOptions> = {
  sampleLines: 10,
  minConfidence: 0.7,
  fallbackSeparator: ',',
};

/**
 * Detects the most likely CSV separator by analyzing sample lines
 */
export function detectSeparator(
  csvContent: string,
  options: SeparatorDetectionOptions = {}
): SeparatorDetectionResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const separators: CsvSeparator[] = [',', ';', '\t', '|'];

  // Get sample lines
  const lines = csvContent
    .split('\n')
    .slice(0, opts.sampleLines)
    .filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      separator: opts.fallbackSeparator,
      confidence: 0,
      analysis: createEmptyAnalysis(),
    };
  }

  const analysis = analyzeSeparators(lines, separators);
  const bestSeparator = selectBestSeparator(analysis);

  const result: SeparatorDetectionResult = {
    separator: bestSeparator.separator,
    confidence: bestSeparator.confidence,
    analysis,
  };

  // Use fallback if confidence is too low
  if (result.confidence < opts.minConfidence) {
    result.separator = opts.fallbackSeparator;
    result.confidence = 0;
  }

  return result;
}

/**
 * Analyzes each potential separator across all sample lines
 */
function analyzeSeparators(
  lines: string[],
  separators: CsvSeparator[]
): SeparatorDetectionResult['analysis'] {
  const analysis: SeparatorDetectionResult['analysis'] = {} as any;

  for (const sep of separators) {
    const counts = lines.map(line => countOccurrences(line, sep));
    const totalCount = counts.reduce((sum, count) => sum + count, 0);
    const nonZeroCounts = counts.filter(count => count > 0);

    // Calculate consistency (how similar are the counts across lines)
    let consistency = 0;
    if (nonZeroCounts.length > 1) {
      const avgCount = nonZeroCounts.reduce((sum, count) => sum + count, 0) / nonZeroCounts.length;
      const variance = nonZeroCounts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / nonZeroCounts.length;
      const stdDev = Math.sqrt(variance);
      consistency = avgCount > 0 ? Math.max(0, 1 - (stdDev / avgCount)) : 0;
    } else if (nonZeroCounts.length === 1) {
      consistency = 1; // Perfect consistency with single line
    }

    // Calculate score (combination of frequency and consistency)
    const frequency = totalCount / lines.length;
    const score = frequency * consistency * (nonZeroCounts.length / lines.length);

    analysis[sep] = {
      count: totalCount,
      consistency,
      score,
    };
  }

  return analysis;
}

/**
 * Selects the separator with the highest score
 */
function selectBestSeparator(
  analysis: SeparatorDetectionResult['analysis']
): { separator: CsvSeparator; confidence: number } {
  const separators: CsvSeparator[] = [',', ';', '\t', '|'];

  let bestSeparator: CsvSeparator = ',';
  let bestScore = 0;

  for (const sep of separators) {
    if (analysis[sep].score > bestScore) {
      bestScore = analysis[sep].score;
      bestSeparator = sep;
    }
  }

  // Calculate confidence based on score difference
  const scores = separators.map(sep => analysis[sep].score).sort((a, b) => b - a);
  const topScore = scores[0];
  const secondScore = scores[1] || 0;

  const confidence = topScore > 0 ? Math.min(1, topScore / Math.max(secondScore * 2, 0.1)) : 0;

  return { separator: bestSeparator, confidence };
}

/**
 * Counts occurrences of a separator in a line, considering quotes
 */
function countOccurrences(line: string, separator: CsvSeparator): number {
  let count = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    // Handle quotes
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      // Check for escaped quotes
      if (i + 1 < line.length && line[i + 1] === quoteChar) {
        i++; // Skip escaped quote
      } else {
        inQuotes = false;
        quoteChar = '';
      }
    }

    // Count separator only if not in quotes
    if (!inQuotes && char === separator) {
      count++;
    }
  }

  return count;
}

/**
 * Creates empty analysis structure
 */
function createEmptyAnalysis(): SeparatorDetectionResult['analysis'] {
  return {
    ',': { count: 0, consistency: 0, score: 0 },
    ';': { count: 0, consistency: 0, score: 0 },
    '\t': { count: 0, consistency: 0, score: 0 },
    '|': { count: 0, consistency: 0, score: 0 },
  };
}

/**
 * Utility function to convert separator to readable name
 */
export function separatorToName(separator: CsvSeparator): string {
  switch (separator) {
    case ',': return 'comma';
    case ';': return 'semicolon';
    case '\t': return 'tab';
    case '|': return 'pipe';
    default: return 'unknown';
  }
}