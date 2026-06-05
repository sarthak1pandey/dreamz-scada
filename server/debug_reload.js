const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://127.0.0.1:1881/';
const PORT = 9223;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const tab = list.find(t => t.url.includes('127.0.0.1:1881') || t.url.includes('localhost:1881')) || list[0];
          if (tab) {
            resolve(tab.webSocketDebuggerUrl);
          } else {
            reject(new Error('No active tabs found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sendCommand(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  ws.send(JSON.stringify({ id, method, params }));
}

async function main() {
  const tempDir = path.join(__dirname, 'chrome_temp_profile_reload');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const logStream = fs.createWriteStream('chrome_ws_reload.log');

  console.log('Launching headless Chrome...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-web-security',
    'about:blank'
  ]);

  await delay(3000);

  try {
    const wsUrl = await getWebSocketUrl();
    console.log('Connecting to ws:', wsUrl);

    const ws = new WebSocket(wsUrl);

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      logStream.write(JSON.stringify(msg, null, 2) + '\n');
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
        console.log(`[CONSOLE] [${msg.params.type}] ${text}`);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.log(`[EXCEPTION]`, JSON.stringify(msg.params.exceptionDetails, null, 2));
      }
    };

    console.log('Enabling CDP domains...');
    sendCommand(ws, 'Runtime.enable');
    sendCommand(ws, 'Log.enable');
    sendCommand(ws, 'Page.enable');
    sendCommand(ws, 'Network.enable');

    await delay(1000);

    console.log('Navigating to target URL:', TARGET_URL);
    sendCommand(ws, 'Page.navigate', { url: TARGET_URL });

    console.log('Waiting 15 seconds for activity and console logs...');
    await delay(15000);

    // Let's capture the page layout/content to see what's in the DOM
    console.log('Requesting DOM content...');
    sendCommand(ws, 'Runtime.evaluate', { expression: 'document.documentElement.outerHTML', returnByValue: true });
    
    await delay(2000);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    console.log('Closing...');
    logStream.end();
    chrome.kill();
    await delay(2000);
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

main();
