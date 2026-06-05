// Test the licensing system
const { getFingerprint } = require('./fingerprint');
const { generateLicenseKey } = require('./license-generator');
const { validateLicense, loadAndValidateLicense } = require('./license-validator');

console.log('Testing Dreamz SCADA Licensing System\n');

// Test fingerprint generation
console.log('1. Testing Hardware Fingerprint:');
const fingerprint = getFingerprint();
console.log(`   Hardware Fingerprint: ${fingerprint}`);

// Test license key generation
console.log('\n2. Testing License Key Generation:');
const licenseResult = generateLicenseKey(fingerprint, 'Test Customer', 30);
console.log(`   Generated License Key: ${licenseResult.licenseKey}`);
console.log(`   Expiry Date: ${licenseResult.expiryDate}`);

// Test license validation
console.log('\n3. Testing License Validation:');
const validationResult = validateLicense(licenseResult.licenseKey);
console.log(`   Valid: ${validationResult.valid}`);
if (validationResult.valid) {
  console.log(`   Customer: ${validationResult.customerName}`);
  console.log(`   Expiry: ${validationResult.expiryStr}`);
  console.log(`   Days Left: ${validationResult.daysLeft}`);
} else {
  console.log(`   Reason: ${validationResult.reason}`);
}

// Test with wrong fingerprint
console.log('\n4. Testing License Validation with Wrong Fingerprint:');
const wrongFp = fingerprint.substring(0, 4) === 'AAAA'
  ? 'BBBB-BBBB-BBBB-BBBB-BBBB-BBBB-BBBB-BBBB'
  : 'AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AAAA';
const wrongPayload = `${wrongFp}|Test Customer|${licenseResult.expiryDate}`;
const wrongSig = require('crypto').createHmac('sha256', 'CHANGE_THIS_IN_PRODUCTION')
  .update(wrongPayload)
  .digest('hex')
  .toUpperCase()
  .slice(0, 32);
const wrongKey = `DREAMZ-${Buffer.from(wrongPayload).toString('base64')}.${wrongSig}`;

const wrongValidation = validateLicense(wrongKey);
console.log(`   Valid: ${wrongValidation.valid}`);
if (!wrongValidation.valid) {
  console.log(`   Reason: ${wrongValidation.reason}`);
}

console.log('\n✅ Licensing system tests completed!');