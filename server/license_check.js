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
    console.log("============================================");
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