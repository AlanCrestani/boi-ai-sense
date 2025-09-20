/**
 * Simple CSV Parser Service
 * Basic CSV parsing functionality for Pipeline ETL
 */
export class CSVParserService {
    /**
     * Parse CSV content into JavaScript objects
     */
    async parseCSV(content, options = {}) {
        const { skipEmptyLines = true, trimHeaders = true, dynamicTyping = false, delimiter = 'auto', } = options;
        try {
            // Detect delimiter if auto
            const detectedDelimiter = delimiter === 'auto' ? this.detectDelimiter(content) : delimiter;
            // Split content into lines
            const lines = content.split(/\r?\n/);
            if (lines.length === 0) {
                return {
                    success: false,
                    errors: ['Empty CSV content'],
                };
            }
            // Filter empty lines if requested
            const filteredLines = skipEmptyLines ? lines.filter(line => line.trim().length > 0) : lines;
            if (filteredLines.length === 0) {
                return {
                    success: false,
                    errors: ['No valid lines found in CSV'],
                };
            }
            // Parse headers
            const headerLine = filteredLines[0];
            let headers = this.parseLine(headerLine, detectedDelimiter);
            if (trimHeaders) {
                headers = headers.map(header => header.trim());
            }
            // Parse data lines
            const data = [];
            const errors = [];
            for (let i = 1; i < filteredLines.length; i++) {
                const line = filteredLines[i];
                if (skipEmptyLines && line.trim().length === 0) {
                    continue;
                }
                try {
                    const values = this.parseLine(line, detectedDelimiter);
                    // Create object from headers and values
                    const record = {};
                    for (let j = 0; j < headers.length; j++) {
                        const header = headers[j];
                        let value = j < values.length ? values[j] : '';
                        // Apply dynamic typing if requested
                        if (dynamicTyping) {
                            value = this.convertType(value);
                        }
                        record[header] = value;
                    }
                    data.push(record);
                }
                catch (parseError) {
                    errors.push(`Error parsing line ${i + 1}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
                }
            }
            return {
                success: errors.length === 0,
                data,
                errors,
                meta: {
                    delimiter: detectedDelimiter,
                    linebreak: '\n',
                    aborted: false,
                    truncated: false,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            };
        }
    }
    /**
     * Detect CSV delimiter by analyzing the first few lines
     */
    detectDelimiter(content) {
        const lines = content.split(/\r?\n/).slice(0, 5); // Check first 5 lines
        const delimiters = [',', ';', '\t', '|'];
        let bestDelimiter = ',';
        let maxScore = 0;
        for (const delimiter of delimiters) {
            let score = 0;
            let consistentCount = true;
            let expectedCount = -1;
            for (const line of lines) {
                if (line.trim().length === 0)
                    continue;
                const count = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
                if (expectedCount === -1) {
                    expectedCount = count;
                }
                else if (expectedCount !== count) {
                    consistentCount = false;
                    break;
                }
                score += count;
            }
            // Prefer delimiters with consistent counts and higher frequency
            if (consistentCount && score > maxScore && expectedCount > 0) {
                maxScore = score;
                bestDelimiter = delimiter;
            }
        }
        return bestDelimiter;
    }
    /**
     * Parse a single CSV line respecting quotes and escaping
     */
    parseLine(line, delimiter) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        while (i < line.length) {
            const char = line[i];
            const nextChar = i + 1 < line.length ? line[i + 1] : '';
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                }
                else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i += 1;
                }
            }
            else if (char === delimiter && !inQuotes) {
                // Field separator
                values.push(current);
                current = '';
                i += 1;
            }
            else {
                // Regular character
                current += char;
                i += 1;
            }
        }
        // Add the last field
        values.push(current);
        return values;
    }
    /**
     * Convert string value to appropriate type
     */
    convertType(value) {
        if (value === '') {
            return null;
        }
        // Try number conversion
        if (/^-?\d+\.?\d*$/.test(value)) {
            const num = parseFloat(value);
            return isNaN(num) ? value : num;
        }
        // Try boolean conversion
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true')
            return true;
        if (lowerValue === 'false')
            return false;
        // Return as string
        return value;
    }
}
