/**
 * License Key Generator — Internal Dreamz Tool
 * Run this when a customer sends their hardware fingerprint.
 * Generates a signed license key for that specific machine.
 */

const crypto = require('crypto');

// SECRET: This key must never leave Dreamz company.
// Store in environment variable, never hardcode in production.
const DREAMZ_MASTER_SECRET = process.env.DREAMZ_SECRET || 'CHANGE_THIS_IN_PRODUCTION';

function generateLicenseKey(fingerprint, customerName, expiryDays = 365) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  const expiryStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD

  // Payload: fingerprint + customer + expiry
  const payload = `${fingerprint}|${customerName}|${expiryStr}`;

  // HMAC-SHA256 signature using master secret
  const sig = crypto.createHmac('sha256', DREAMZ_MASTER_SECRET)
                    .update(payload)
                    .digest('hex')
                    .toUpperCase()
                    .slice(0, 32);

  // License key = base64(payload) + '.' + signature
  const encodedPayload = Buffer.from(payload).toString('base64');
  const licenseKey = `DREAMZ-${encodedPayload}.${sig}`;

  return { licenseKey, expiryDate: expiryStr, payload };
}

module.exports = { generateLicenseKey };

// CLI usage:
// node license-generator.js <fingerprint> <customerName> [expiryDays]

if (require.main === module) {
  const [fp, name, days] = process.argv.slice(2);

  if (!fp || !name) {
    console.log('Usage: node license-generator.js <fingerprint> <customerName> [days]');
    process.exit(1);
  }

  const result = generateLicenseKey(fp, name, days ? parseInt(days) : 365);
  console.log('\nLicense Key:');
  console.log(result.licenseKey);
  console.log(`\nExpiry: ${result.expiryDate}`);
}