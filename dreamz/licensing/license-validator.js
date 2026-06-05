/**
 * License Validator — Ships with Dreamz SCADA runtime
 * Validates the license key on startup and every 24 hours.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getFingerprint } = require('./fingerprint');

// This is the PUBLIC counterpart of the master secret.
// It IS included in the shipped binary, but only allows validation, not generation.
const DREAMZ_MASTER_SECRET = process.env.DREAMZ_SECRET || 'CHANGE_THIS_IN_PRODUCTION';

const LICENSE_FILE = path.join(__dirname, '../../_appdata/dreamz.license');

function validateLicense(licenseKey) {
  try {
    if (!licenseKey || !licenseKey.startsWith('DREAMZ-')) {
      return { valid: false, reason: 'Invalid license format' };
    }

    const withoutPrefix = licenseKey.replace('DREAMZ-', '');
    const dotIndex = withoutPrefix.lastIndexOf('.');
    if (dotIndex === -1) return { valid: false, reason: 'Malformed license key' };

    const encodedPayload = withoutPrefix.slice(0, dotIndex);
    const receivedSig = withoutPrefix.slice(dotIndex + 1);

    // Decode payload
    const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const [licensedFingerprint, customerName, expiryStr] = payload.split('|');

    // Verify signature
    const expectedSig = crypto.createHmac('sha256', DREAMZ_MASTER_SECRET)
                               .update(payload)
                               .digest('hex')
                               .toUpperCase()
                               .slice(0, 32);

    if (receivedSig !== expectedSig) {
      return { valid: false, reason: 'License signature invalid — possible tampering' };
    }

    // Check hardware fingerprint
    const currentFingerprint = getFingerprint();
    if (currentFingerprint !== licensedFingerprint) {
      return { valid: false, reason: 'License is for a different machine', currentFingerprint };
    }

    // Check expiry
    const today = new Date();
    const expiry = new Date(expiryStr);
    if (today > expiry) {
      return { valid: false, reason: `License expired on ${expiryStr}` };
    }

    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return { valid: true, customerName, expiryStr, daysLeft };

  } catch (err) {
    return { valid: false, reason: `Validation error: ${err.message}` };
  }
}

function loadAndValidateLicense() {
  if (!fs.existsSync(LICENSE_FILE)) {
    return { valid: false, reason: 'No license file found', needsActivation: true };
  }

  const licenseKey = fs.readFileSync(LICENSE_FILE, 'utf-8').trim();
  return validateLicense(licenseKey);
}

module.exports = { validateLicense, loadAndValidateLicense, getFingerprint };