const http = require('http');

const endpoints = [
  '/api/version',
  '/api/settings',
  '/api/dreamz/license/status',
  '/api/project'
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: '127.0.0.1',
      port: 1881,
      path: path,
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[SUCCESS] ${path} - Status: ${res.statusCode}`);
        try {
          console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
          console.log(data.substring(0, 200));
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`[ERROR] ${path} - ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`[TIMEOUT] ${path} after 3s`);
      req.destroy();
      resolve();
    });
  });
}

async function run() {
  for (const ep of endpoints) {
    await testEndpoint(ep);
  }
}

run();
