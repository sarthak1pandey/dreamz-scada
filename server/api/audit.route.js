/**
 * Audit API Route — Dreamz SCADA
 * GET /api/dreamz/audit — Paginated audit log viewer
 * GET /api/dreamz/audit/export — CSV export of audit logs
 */

const express = require('express');
const router = express.Router();
const { queryAuditLogs } = require('../../dreamz/audit/audit-logger');

// GET /api/dreamz/audit?page=1&pageSize=50&user=admin&method=POST&startDate=...&endDate=...
router.get('/audit', async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 50,
      user: req.query.user || null,
      method: req.query.method || null,
      endpoint: req.query.endpoint || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };

    const result = await queryAuditLogs(options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dreamz/audit/export — CSV export
router.get('/audit/export', async (req, res) => {
  try {
    const result = await queryAuditLogs({ page: 1, pageSize: 10000 });

    const headers = ['id', 'timestamp', 'user', 'method', 'endpoint', 'status_code', 'ip', 'duration_ms', 'body_summary'];
    const csvRows = [headers.join(',')];

    for (const row of result.rows) {
      const values = headers.map(h => {
        const val = row[h] || '';
        // Escape commas and quotes in CSV
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dreamz-audit-${Date.now()}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
