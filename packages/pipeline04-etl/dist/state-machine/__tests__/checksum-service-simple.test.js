/**
 * Simple Tests for Checksum Service - Node.js compatible
 */
import { ChecksumService } from '../checksum-service.js';
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
function runChecksumTests() {
    console.log('Running Checksum Service Tests...');
    // Test buffer checksum calculation
    console.log('✓ Testing buffer checksum calculation...');
    const mockSupabaseClient = {
        from: () => mockSupabaseClient,
        select: () => mockSupabaseClient,
        eq: () => mockSupabaseClient,
        order: () => mockSupabaseClient,
        limit: () => mockSupabaseClient,
    };
    const checksumService = new ChecksumService(mockSupabaseClient);
    // Test SHA-256 checksum
    const testData = 'Hello, World!';
    const testBuffer = Buffer.from(testData, 'utf-8');
    const sha256Result = checksumService.calculateBufferChecksum(testBuffer, 'sha256');
    // Expected SHA-256 hash for "Hello, World!"
    const expectedSha256 = 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f';
    assert(sha256Result === expectedSha256, `SHA-256 hash should match expected value. Got: ${sha256Result}`);
    // Test MD5 checksum
    const md5Result = checksumService.calculateBufferChecksum(testBuffer, 'md5');
    // Expected MD5 hash for "Hello, World!"
    const expectedMd5 = '65a8e27d8879283831b664bd8b7f0ad4';
    assert(md5Result === expectedMd5, `MD5 hash should match expected value. Got: ${md5Result}`);
    // Test empty buffer
    const emptyBuffer = Buffer.alloc(0);
    const emptySha256 = checksumService.calculateBufferChecksum(emptyBuffer, 'sha256');
    const expectedEmptySha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    assert(emptySha256 === expectedEmptySha256, `Empty buffer SHA-256 should match expected value`);
    // Test different data produces different hashes
    const testData2 = 'Different data';
    const testBuffer2 = Buffer.from(testData2, 'utf-8');
    const sha256Result2 = checksumService.calculateBufferChecksum(testBuffer2, 'sha256');
    assert(sha256Result !== sha256Result2, 'Different data should produce different hashes');
    // Test consistency - same data should always produce same hash
    const sha256Repeat = checksumService.calculateBufferChecksum(testBuffer, 'sha256');
    assert(sha256Result === sha256Repeat, 'Same data should always produce same hash');
    console.log('🎉 All checksum tests passed!');
}
export { runChecksumTests };
// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        runChecksumTests();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
