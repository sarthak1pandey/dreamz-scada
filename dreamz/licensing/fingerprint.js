/**
 * Hardware Fingerprint Generator
 * Collects stable hardware identifiers and hashes them into a fingerprint.
 * Same machine → same fingerprint every time.
 */

const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

function getMacAddresses() {
  const interfaces = os.networkInterfaces();
  const macs = [];

  for (const iface of Object.values(interfaces)) {
    for (const entry of iface) {
      // Skip loopback and virtual adapters
      if (!entry.internal && entry.mac !== '00:00:00:00:00:00') {
        macs.push(entry.mac.toUpperCase());
      }
    }
  }

  return macs.sort();  // sort for determinism
}

function getCpuId() {
  try {
    if (process.platform === 'win32') {
      const out = execSync('wmic cpu get ProcessorId /value', { encoding: 'utf8' });
      const match = out.match(/ProcessorId=(.+)/);
      return match ? match[1].trim() : 'UNKNOWN';
    } else if (process.platform === 'linux') {
      const out = execSync("cat /proc/cpuinfo | grep -m1 'Serial' | awk '{print $3}'", { encoding: 'utf8' });
      return out.trim() || 'LINUX_NO_SERIAL';
    } else {
      return 'MACOS_' + os.hostname();
    }
  } catch {
    return 'CPU_READ_FAILED';
  }
}

function getFingerprint() {
  const macs = getMacAddresses();
  const cpuId = getCpuId();
  const hostname = os.hostname();
  const platform = process.platform;

  // Combine stable hardware identifiers
  const raw = [
    macs.join(','),
    cpuId,
    hostname,
    platform
  ].join('|');

  // SHA-256 → take first 32 chars → format as XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
  const fp = hash.slice(0, 32).match(/.{1,4}/g).join('-');

  return fp;
}

module.exports = { getFingerprint };