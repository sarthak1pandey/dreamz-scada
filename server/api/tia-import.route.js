const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { importTiaXml } = require('../../dreamz/tia-importer/tia-importer');

// Use OS temp dir for cross-platform compatibility (Windows + Linux)
const uploadDir = path.join(os.tmpdir(), 'dreamz-tia-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// POST /api/dreamz/tia-import
// Body: multipart form with fields: file (XML), deviceName (string)
router.post('/tia-import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const deviceName = req.body.deviceName || 'Default_PLC';
    const outputPath = path.join(os.tmpdir(), `dreamz-tia-output-${Date.now()}.json`);

    const result = importTiaXml(req.file.path, deviceName, outputPath);
    const tags = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

    // Clean up temp files
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    try { fs.unlinkSync(outputPath); } catch (_) {}

    res.json({ success: true, tags, skipped: result.skipped, total: result.total });
  } catch (err) {
    // Clean up on error too
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;