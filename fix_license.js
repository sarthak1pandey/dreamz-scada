const fs = require('fs');

let content = fs.readFileSync('server/main.js.backup', 'utf8');

const licenseCheck = `
// License check at startup
const { loadAndValidateLicense, getFingerprint } = require("../dreamz/licensing/license-validator");

const licenseResult = loadAndValidateLicense();

if (!licenseResult.valid) {
  if (licenseResult.needsActivation) {
    const fp = getFingerprint();
    console.log("\n============================================");
    console.log("  DREAMZ SCADA — ACTIVATION REQUIRED");
    console.log("============================================");
    console.log("  Hardware Fingerprint:");
    console.log(" ", fp);
    console.log("\n  Send this fingerprint to Dreamz Automation");
    console.log("  to receive your license key.");
    console.log("\n  Place license key in:");
    console.log(" ", require("path").join(__dirname, "_appdata/dreamz.license"));
    console.log("============================================\n");
  } else {
    console.error("LICENSE ERROR:", licenseResult.reason);
  }
  // Start in demo/view-only mode OR exit — your choice:
  // process.exit(1);   // hard stop
  // OR: set a global flag to disable write operations
  global.DREAMZ_LICENSED = false;
} else {
  console.log(\`Dreamz SCADA licensed to: \${licenseResult.customerName}\`);
  console.log(\`License expires: \${licenseResult.expiryStr} (\${licenseResult.daysLeft} days)\`);
  global.DREAMZ_LICENSED = true;
}`;

const insertPoint = content.indexOf('initWebcamSnapshotCleanup();');
if (insertPoint !== -1) {
  // Find the end of that statement block
  const bracePos = content.indexOf('});', insertPoint);
  if (bracePos !== -1) {
    const insertAfter = bracePos + 3; // After the });
    const newContent = content.slice(0, insertAfter) + licenseCheck + content.slice(insertAfter);
    fs.writeFileSync('server/main.js', newContent, 'utf8');
    console.log('License check inserted successfully');
  } else {
    console.log('Could not find closing brace for initWebcamSnapshotCleanup');
  }
} else {
  console.log('Could not find initWebcamSnapshotCleanup();');
}