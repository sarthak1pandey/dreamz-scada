const crypto = require('crypto');

const secret = process.env.DREAMZ_SECRET || 'CHANGE_THIS_IN_PRODUCTION';
const fingerprint = '18A1-75FE-4D15-BFD2-CDF1-72C6-0E73-325C';
const customerName = 'Dreamz Partner';
const expiryStr = '2036-06-04'; // 10 years expiry

const payload = `${fingerprint}|${customerName}|${expiryStr}`;
const encodedPayload = Buffer.from(payload).toString('base64');

const expectedSig = crypto.createHmac('sha256', secret)
                           .update(payload)
                           .digest('hex')
                           .toUpperCase()
                           .slice(0, 32);

const licenseKey = `DREAMZ-${encodedPayload}.${expectedSig}`;
console.log('=== GENERATED LICENSE KEY ===');
console.log(licenseKey);
console.log('=============================');
