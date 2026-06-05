// License check at startup
const { loadAndValidateLicense, getFingerprint } = require("../dreamz/licensing/license-validator");

const licenseResult = loadAndValidateLicense();

if (!licenseResult.valid) {
  if (licenseResult.needsActivation) {
    const fp = getFingerprint();
    console.log("\n============================================\n");
    console.log("  DREAMZ SCADA — ACTIVATION REQUIRED\n");
    console.log("============================================\n");
    console.log("  Hardware Fingerprint:\n");
    console.log(" ", fp);
    console.log("\n  Send this fingerprint to Dreamz Automation\n");
    console.log("  to receive your license key.\n");
    console.log("\n  Place license key in:\n");
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
  console.log(`Dreamz SCADA licensed to: ${licenseResult.customerName}`);
  console.log(`License expires: ${licenseResult.expiryStr} (${licenseResult.daysLeft} days)`);
  global.DREAMZ_LICENSED = true;
}