/**
 * License API Route — Dreamz SCADA
 * POST /api/dreamz/license/activate  – activate with a license key
 * GET  /api/dreamz/license/status    – get current license status + fingerprint
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { validateLicense, loadAndValidateLicense, getFingerprint } = require('../../dreamz/licensing/license-validator');

// Resolve license file path relative to server/_appdata
function getLicenseFilePath() {
  // Works whether started from server/ or project root
  const candidates = [
    path.join(__dirname, '..', '_appdata', 'dreamz.license'),
    path.resolve(process.cwd(), '_appdata', 'dreamz.license')
  ];
  for (const p of candidates) {
    const dir = path.dirname(p);
    if (fs.existsSync(dir)) return p;
  }
  return candidates[0];
}

// GET /api/dreamz/license/status
router.get('/license/status', (req, res) => {
  try {
    const result = loadAndValidateLicense();
    const fingerprint = getFingerprint();

    res.json({
      licensed: result.valid,
      fingerprint,
      customerName: result.customerName || null,
      expiryDate: result.expiryStr || null,
      daysLeft: result.daysLeft || 0,
      reason: result.reason || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dreamz/license/activate
router.post('/license/activate', express.json(), (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) {
      return res.status(400).json({ success: false, error: 'License key is required' });
    }

    // Validate the key before saving
    const result = validateLicense(licenseKey.trim());

    if (!result.valid) {
      return res.json({
        success: false,
        error: result.reason,
        fingerprint: getFingerprint()
      });
    }

    // Save the validated key to file
    const licensePath = getLicenseFilePath();
    fs.writeFileSync(licensePath, licenseKey.trim(), 'utf-8');

    // Update global flag
    global.DREAMZ_LICENSED = true;

    res.json({
      success: true,
      customerName: result.customerName,
      expiryDate: result.expiryStr,
      daysLeft: result.daysLeft
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
