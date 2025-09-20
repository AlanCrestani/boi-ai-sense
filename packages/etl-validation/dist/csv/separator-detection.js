/**
 * CSV Separator Detection Utility
 * Automatically detects the separator used in CSV files by analyzing sample lines
 */
const DEFAULT_SEPARATORS = [',', ';', '\t', '|'];
const DEFAULT_OPTIONS = {
    sampleLines: 5,
    minConfidence: 0.7,
    customSeparators: []
};
/**
 * Detects the most likely CSV separator by analyzing the first N lines
 * @param csvContent - The CSV content as string
 * @param options - Detection options
 * @returns Detection result with separator and confidence
 */
export function detectSeparator(csvContent, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
        throw new Error('No content to analyze for separator detection');
    }
    // Take sample lines for analysis
    const sampleLines = lines.slice(0, Math.min(opts.sampleLines, lines.length));
    const separatorsToTest = [...DEFAULT_SEPARATORS, ...opts.customSeparators];
    const separatorScores = {};
    // Initialize scores for each separator
    separatorsToTest.forEach(sep => {
        separatorScores[sep] = [];
    });
    // Analyze each sample line
    sampleLines.forEach(line => {
        separatorsToTest.forEach(separator => {
            const fields = line.split(separator);
            const fieldCount = fields.length;
            // Score based on field count and consistency
            let score = 0;
            if (fieldCount > 1) {
                // More fields = higher base score
                score = fieldCount;
                // Bonus for consistent field lengths (not too short, not too long)
                const avgFieldLength = fields.reduce((sum, field) => sum + field.trim().length, 0) / fieldCount;
                if (avgFieldLength >= 2 && avgFieldLength <= 50) {
                    score += 2;
                }
                // Bonus for fields that look like data (contain alphanumeric)
                const validFields = fields.filter(field => /[a-zA-Z0-9]/.test(field.trim()));
                if (validFields.length === fieldCount) {
                    score += 1;
                }
                // Penalty for separators that appear within quoted fields
                if (separator !== '\t') {
                    const quotedFieldPattern = /"[^"]*"/g;
                    const quotedFields = line.match(quotedFieldPattern) || [];
                    quotedFields.forEach(quotedField => {
                        if (quotedField.includes(separator)) {
                            score -= 3; // Heavy penalty
                        }
                    });
                }
            }
            separatorScores[separator].push(score);
        });
    });
    // Calculate final scores and consistency
    const finalScores = {};
    Object.entries(separatorScores).forEach(([separator, scores]) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        // Calculate consistency (lower variance = higher consistency)
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
        const consistency = Math.max(0, 1 - (variance / 10)); // Normalize variance
        finalScores[separator] = {
            score: avgScore,
            consistency: consistency
        };
    });
    // Find the best separator
    let bestSeparator = ','; // Default fallback
    let bestScore = 0;
    let confidence = 0;
    Object.entries(finalScores).forEach(([separator, { score, consistency }]) => {
        const combinedScore = score * (1 + consistency); // Weight consistency
        if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestSeparator = separator;
            confidence = Math.min(1, combinedScore / 10); // Normalize to 0-1
        }
    });
    // Create detection pattern for debugging
    const detectedPattern = {
        comma: finalScores[',']?.score || 0,
        semicolon: finalScores[';']?.score || 0,
        tab: finalScores['\t']?.score || 0,
        pipe: finalScores['|']?.score || 0
    };
    return {
        separator: bestSeparator,
        confidence,
        detectedPattern
    };
}
/**
 * Validates if a separator detection is reliable
 * @param result - Detection result
 * @param minConfidence - Minimum confidence threshold
 * @returns True if detection is reliable
 */
export function isDetectionReliable(result, minConfidence = 0.7) {
    return result.confidence >= minConfidence;
}
/**
 * Gets a human-readable name for a separator
 * @param separator - The separator character
 * @returns Human-readable name
 */
export function getSeparatorName(separator) {
    switch (separator) {
        case ',': return 'Comma';
        case ';': return 'Semicolon';
        case '\t': return 'Tab';
        case '|': return 'Pipe';
        default: return `Custom (${separator})`;
    }
}
/**
 * Analyzes a CSV file and provides detailed separator detection report
 * @param csvContent - The CSV content
 * @param options - Detection options
 * @returns Detailed analysis report
 */
export function analyzeCsvSeparators(csvContent, options = {}) {
    const result = detectSeparator(csvContent, options);
    const isReliable = isDetectionReliable(result, options.minConfidence);
    let recommendation;
    if (isReliable) {
        recommendation = `Use ${getSeparatorName(result.separator)} as the separator with ${(result.confidence * 100).toFixed(1)}% confidence.`;
    }
    else {
        recommendation = `Detection confidence is low (${(result.confidence * 100).toFixed(1)}%). Manual verification recommended.`;
    }
    // Find alternative separators
    const alternatives = Object.entries(result.detectedPattern)
        .map(([type, score]) => {
        const separator = type === 'comma' ? ',' :
            type === 'semicolon' ? ';' :
                type === 'tab' ? '\t' : '|';
        return {
            separator,
            confidence: Math.min(1, score / 10),
            name: getSeparatorName(separator)
        };
    })
        .filter(alt => alt.separator !== result.separator && alt.confidence > 0.1)
        .sort((a, b) => b.confidence - a.confidence);
    return {
        result,
        isReliable,
        recommendation,
        alternativeSeparators: alternatives
    };
}
