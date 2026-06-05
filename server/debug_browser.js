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
  const tempDir = path.join(__dirname, 'chrome_temp_profile');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const logStream = fs.createWriteStream('chrome_ws_raw.log');

  console.log('Launching headless Chrome...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-web-security',
    TARGET_URL
  ]);

  await delay(4000);

  try {
    const wsUrl = await getWebSocketUrl();
    console.log('Connecting to ws:', wsUrl);

    const ws = new WebSocket(wsUrl);

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    ws.onmessage = (event) => {
      logStream.write(event.data + '\n');
    };

    console.log('Enabling CDP domains...');
    sendCommand(ws, 'Runtime.enable');
    sendCommand(ws, 'Log.enable');
    sendCommand(ws, 'Page.enable');
    sendCommand(ws, 'Network.enable');

    console.log('Waiting 10 seconds for activity...');
    await delay(10000);

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
