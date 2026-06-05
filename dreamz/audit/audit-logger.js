/**
 * Audit Logger — Dreamz SCADA
 * Logs all mutating API actions (POST/PUT/DELETE) into a SQLite database
 * for compliance, traceability, and troubleshooting.
 */

const { createRequire } = require('module');
const serverRequire = createRequire(require.resolve('../../server/main.js'));
const sqlite3 = serverRequire('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db = null;
let initialized = false;

/**
 * Initialize the audit database
 * @param {string} workDir - path to _appdata directory
 */
function initAuditDb(workDir) {
  if (initialized) return;

  const dbPath = path.join(workDir, 'audit.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[Audit] Failed to open audit database:', err.message);
      return;
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      user TEXT DEFAULT 'anonymous',
      method TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      status_code INTEGER,
      ip TEXT,
      user_agent TEXT,
      body_summary TEXT,
      duration_ms INTEGER
    )
  `, (err) => {
    if (err) {
      console.error('[Audit] Failed to create audit_log table:', err.message);
    } else {
      initialized = true;
      console.log('[Audit] Audit database initialized at:', dbPath);
    }
  });

  // Create index for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_endpoint ON audit_log(endpoint)`);
}

/**
 * Express middleware that logs mutating requests to the audit DB
 */
function auditMiddleware(req, res, next) {
  if (!initialized || !db) {
    return next();
  }

  // Only log mutating operations + login attempts
  const loggableMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!loggableMethods.includes(req.method)) {
    return next();
  }

  // Skip high-frequency heartbeat/version checks
  const skipPaths = ['/api/heartbeat', '/api/version', '/socket.io'];
  if (skipPaths.some(p => req.path.startsWith(p))) {
    return next();
  }

  const startTime = Date.now();

  // Capture the response status after it's sent
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // Truncate body summary for storage (avoid logging passwords)
    let bodySummary = '';
    if (req.body) {
      const sanitized = { ...req.body };
      // Redact sensitive fields
      ['password', 'secretCode', 'licenseKey', 'token'].forEach(key => {
        if (sanitized[key]) sanitized[key] = '***';
      });
      bodySummary = JSON.stringify(sanitized).substring(0, 500);
    }

    const user = req.userId || req.apiKey || 'anonymous';
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    db.run(
      `INSERT INTO audit_log (user, method, endpoint, status_code, ip, user_agent, body_summary, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user,
        req.method,
        req.originalUrl || req.url,
        res.statusCode,
        ip,
        (req.headers['user-agent'] || '').substring(0, 200),
        bodySummary,
        duration
      ],
      (err) => {
        if (err) {
          console.error('[Audit] Failed to log:', err.message);
        }
      }
    );

    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Query audit logs with pagination and filtering
 * @param {Object} options - { page, pageSize, user, method, endpoint, startDate, endDate }
 * @returns {Promise<{rows: Array, total: number}>}
 */
function queryAuditLogs(options = {}) {
  return new Promise((resolve, reject) => {
    if (!initialized || !db) {
      return reject(new Error('Audit database not initialized'));
    }

    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 50));
    const offset = (page - 1) * pageSize;

    let where = [];
    let params = [];

    if (options.user) {
      where.push('user LIKE ?');
      params.push(`%${options.user}%`);
    }
    if (options.method) {
      where.push('method = ?');
      params.push(options.method);
    }
    if (options.endpoint) {
      where.push('endpoint LIKE ?');
      params.push(`%${options.endpoint}%`);
    }
    if (options.startDate) {
      where.push('timestamp >= ?');
      params.push(options.startDate);
    }
    if (options.endDate) {
      where.push('timestamp <= ?');
      params.push(options.endDate);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    // Get total count
    db.get(`SELECT COUNT(*) as total FROM audit_log ${whereClause}`, params, (err, countRow) => {
      if (err) return reject(err);

      const total = countRow ? countRow.total : 0;

      // Get paginated rows
      db.all(
        `SELECT * FROM audit_log ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
        (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [], total, page, pageSize });
        }
      );
    });
  });
}

module.exports = { initAuditDb, auditMiddleware, queryAuditLogs };
