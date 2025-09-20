/**
 * Tests for header mapping functionality
 */

import { HeaderMapper } from '../header-mapping.js';

export async function testHeaderMapping(): Promise<void> {
  // Test configuration
  const config = {
    fields: {
      name: {
        canonical: 'name',
        required: true,
        type: 'string' as const,
        aliases: ['nome', 'full_name', 'customer_name'],
      },
      age: {
        canonical: 'age',
        required: true,
        type: 'number' as const,
        aliases: ['idade', 'years'],
      },
      email: {
        canonical: 'email',
        required: false,
        type: 'string' as const,
        aliases: ['e-mail', 'email_address'],
        validate: (value: any) => {
          if (typeof value === 'string' && value.includes('@')) {
            return true;
          }
          return 'Invalid email format';
        },
      },
      is_active: {
        canonical: 'is_active',
        required: false,
        type: 'boolean' as const,
        aliases: ['active', 'enabled', 'status'],
        defaultValue: true,
      },
      birth_date: {
        canonical: 'birth_date',
        required: false,
        type: 'date' as const,
        aliases: ['birthday', 'date_of_birth', 'nascimento'],
      },
    },
    caseSensitive: false,
  };

  const mapper = new HeaderMapper(config);

  // Test 1: Perfect header matching
  const perfectHeaders = ['name', 'age', 'email', 'is_active'];
  const analysis1 = mapper.analyzeHeaders(perfectHeaders);

  if (analysis1.confidence < 0.9) {
    throw new Error(`Expected high confidence for perfect match, got ${analysis1.confidence}`);
  }

  if (analysis1.mappedHeaders.length !== 4) {
    throw new Error(`Expected 4 mapped headers, got ${analysis1.mappedHeaders.length}`);
  }

  if (analysis1.missingRequired.length > 0) {
    throw new Error(`Expected no missing required fields, got ${analysis1.missingRequired.join(', ')}`);
  }

  // Test 2: Alias matching
  const aliasHeaders = ['nome', 'idade', 'e-mail', 'active'];
  const analysis2 = mapper.analyzeHeaders(aliasHeaders);

  if (analysis2.mappedHeaders.length !== 4) {
    throw new Error(`Expected 4 mapped headers with aliases, got ${analysis2.mappedHeaders.length}`);
  }

  // Test 3: Missing required fields
  const incompleteHeaders = ['nome', 'e-mail']; // Missing required 'age'
  const analysis3 = mapper.analyzeHeaders(incompleteHeaders);

  if (analysis3.missingRequired.length !== 1 || analysis3.missingRequired[0] !== 'age') {
    throw new Error(`Expected missing 'age' field, got ${analysis3.missingRequired.join(', ')}`);
  }

  if (analysis3.confidence > 0.5) {
    throw new Error(`Expected low confidence for missing required field, got ${analysis3.confidence}`);
  }

  // Test 4: Row mapping with valid data
  const validHeaders = ['name', 'age', 'email'];
  mapper.analyzeHeaders(validHeaders);

  const validRow = mapper.mapRow(
    ['John Doe', '30', 'john@example.com'],
    validHeaders,
    1
  );

  if (validRow.mapped.name !== 'John Doe') {
    throw new Error('String mapping failed');
  }

  if (validRow.mapped.age !== 30) {
    throw new Error('Number conversion failed');
  }

  if (validRow.mapped.email !== 'john@example.com') {
    throw new Error('Email mapping failed');
  }

  if (validRow.mapped.is_active !== true) {
    throw new Error('Default value not applied');
  }

  if (validRow.errors.length > 0) {
    throw new Error(`Unexpected errors: ${validRow.errors.map(e => e.message).join(', ')}`);
  }

  // Test 5: Type conversion errors
  const invalidHeaders = ['name', 'age', 'email'];
  const invalidRow = mapper.mapRow(
    ['Jane Doe', 'not_a_number', 'invalid_email'],
    invalidHeaders,
    2
  );

  if (invalidRow.errors.length < 2) {
    throw new Error(`Expected at least 2 errors, got ${invalidRow.errors.length}`);
  }

  // Should have errors for age conversion and email validation
  const hasAgeError = invalidRow.errors.some(e => e.field === 'age');
  const hasEmailError = invalidRow.errors.some(e => e.field === 'email');

  if (!hasAgeError) {
    throw new Error('Expected age conversion error');
  }

  if (!hasEmailError) {
    throw new Error('Expected email validation error');
  }

  // Test 6: Boolean conversion
  const boolHeaders = ['name', 'age', 'is_active'];
  mapper.analyzeHeaders(boolHeaders);

  const boolTests = [
    { input: 'true', expected: true },
    { input: '1', expected: true },
    { input: 'yes', expected: true },
    { input: 'sim', expected: true },
    { input: 'false', expected: false },
    { input: '0', expected: false },
    { input: 'no', expected: false },
    { input: 'não', expected: false },
  ];

  for (const test of boolTests) {
    const row = mapper.mapRow(['Test', '25', test.input], boolHeaders, 1);
    if (row.mapped.is_active !== test.expected) {
      throw new Error(`Boolean conversion failed for '${test.input}': expected ${test.expected}, got ${row.mapped.is_active}`);
    }
  }

  // Test 7: Date conversion
  const dateHeaders = ['name', 'age', 'birth_date'];
  mapper.analyzeHeaders(dateHeaders);

  const dateRow = mapper.mapRow(
    ['John', '30', '1993-01-15'],
    dateHeaders,
    1
  );

  if (!(dateRow.mapped.birth_date instanceof Date)) {
    throw new Error('Date conversion failed');
  }

  // Test 8: Case insensitive matching
  const mixedCaseHeaders = ['NAME', 'AGE', 'EMAIL'];
  const analysis4 = mapper.analyzeHeaders(mixedCaseHeaders);

  if (analysis4.mappedHeaders.length !== 3) {
    throw new Error(`Case insensitive matching failed, got ${analysis4.mappedHeaders.length} mapped`);
  }

  // Test 9: Unmapped fields tracking
  const extraHeaders = ['name', 'age', 'unknown_field', 'another_unknown'];
  const analysis5 = mapper.analyzeHeaders(extraHeaders);

  if (analysis5.unmappedHeaders.length !== 2) {
    throw new Error(`Expected 2 unmapped headers, got ${analysis5.unmappedHeaders.length}`);
  }

  const unmappedRow = mapper.mapRow(
    ['John', '30', 'value1', 'value2'],
    extraHeaders,
    1
  );

  if (unmappedRow.unmappedFields.length !== 2) {
    throw new Error(`Expected 2 unmapped fields in row, got ${unmappedRow.unmappedFields.length}`);
  }

  // Test 10: Suggestions for similar headers
  const similarHeaders = ['nam', 'ag', 'emai']; // Typos
  const analysis6 = mapper.analyzeHeaders(similarHeaders);

  if (analysis6.suggestions.length === 0) {
    throw new Error('Expected suggestions for similar headers');
  }

  console.log('   ✓ Perfect header matching');
  console.log('   ✓ Alias header matching');
  console.log('   ✓ Missing required field detection');
  console.log('   ✓ Valid data row mapping');
  console.log('   ✓ Type conversion error handling');
  console.log('   ✓ Boolean value conversion');
  console.log('   ✓ Date value conversion');
  console.log('   ✓ Case insensitive matching');
  console.log('   ✓ Unmapped field tracking');
  console.log('   ✓ Header similarity suggestions');
}