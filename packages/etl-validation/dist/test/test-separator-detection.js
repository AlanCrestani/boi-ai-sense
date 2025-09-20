/**
 * Tests for separator detection functionality
 */
import { detectSeparator, separatorToName } from '../separator-detection.js';
export async function testSeparatorDetection() {
    // Test 1: Basic comma detection
    const commaCSV = `name,age,city
John,25,New York
Jane,30,London`;
    const commaResult = detectSeparator(commaCSV);
    if (commaResult.separator !== ',') {
        throw new Error(`Expected comma separator, got ${commaResult.separator}`);
    }
    if (commaResult.confidence < 0.8) {
        throw new Error(`Low confidence for comma detection: ${commaResult.confidence}`);
    }
    // Test 2: Semicolon detection
    const semicolonCSV = `nome;idade;cidade
João;25;São Paulo
Maria;30;Rio de Janeiro`;
    const semicolonResult = detectSeparator(semicolonCSV);
    if (semicolonResult.separator !== ';') {
        throw new Error(`Expected semicolon separator, got ${semicolonResult.separator}`);
    }
    // Test 3: Tab detection
    const tabCSV = `name\tage\tcity
John\t25\tNew York
Jane\t30\tLondon`;
    const tabResult = detectSeparator(tabCSV);
    if (tabResult.separator !== '\t') {
        throw new Error(`Expected tab separator, got ${tabResult.separator}`);
    }
    // Test 4: Pipe detection
    const pipeCSV = `name|age|city
John|25|New York
Jane|30|London`;
    const pipeResult = detectSeparator(pipeCSV);
    if (pipeResult.separator !== '|') {
        throw new Error(`Expected pipe separator, got ${pipeResult.separator}`);
    }
    // Test 5: Mixed separators (should choose most consistent)
    const mixedCSV = `name,age;city
John,25;New York
Jane,30;London`;
    const mixedResult = detectSeparator(mixedCSV);
    // Should detect comma as more consistent
    if (mixedResult.separator !== ',') {
        throw new Error(`Expected comma for mixed separators, got ${mixedResult.separator}`);
    }
    // Test 6: Quoted fields with commas
    const quotedCSV = `"name","description","value"
"John","Software Engineer, Team Lead","50000"
"Jane","Product Manager, Senior","60000"`;
    const quotedResult = detectSeparator(quotedCSV);
    if (quotedResult.separator !== ',') {
        throw new Error(`Expected comma for quoted CSV, got ${quotedResult.separator}`);
    }
    // Test 7: Empty content (should use fallback)
    const emptyResult = detectSeparator('');
    if (emptyResult.separator !== ',') {
        throw new Error(`Expected fallback comma for empty content, got ${emptyResult.separator}`);
    }
    if (emptyResult.confidence !== 0) {
        throw new Error(`Expected zero confidence for empty content, got ${emptyResult.confidence}`);
    }
    // Test 8: Custom options
    const customResult = detectSeparator(semicolonCSV, {
        sampleLines: 5,
        minConfidence: 0.9,
        fallbackSeparator: '|',
    });
    if (customResult.separator !== ';') {
        throw new Error(`Expected semicolon with custom options, got ${customResult.separator}`);
    }
    // Test 9: Separator name conversion
    if (separatorToName(',') !== 'comma') {
        throw new Error('Comma name conversion failed');
    }
    if (separatorToName(';') !== 'semicolon') {
        throw new Error('Semicolon name conversion failed');
    }
    if (separatorToName('\t') !== 'tab') {
        throw new Error('Tab name conversion failed');
    }
    if (separatorToName('|') !== 'pipe') {
        throw new Error('Pipe name conversion failed');
    }
    console.log('   ✓ Basic separator detection');
    console.log('   ✓ Multiple separator types');
    console.log('   ✓ Quoted field handling');
    console.log('   ✓ Edge cases and fallbacks');
    console.log('   ✓ Custom options');
    console.log('   ✓ Separator name conversion');
}
