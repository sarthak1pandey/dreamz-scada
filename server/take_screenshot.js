/**
 * take_screenshot.js - Take a screenshot of the running app
 */
const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://127.0.0.1:1881/';
const DEBUG_PORT = 9225;

try { execSync('taskkill /f /im chrome.exe 2>nul', { stdio: 'ignore' }); } catch(e) {}

const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    '--user-data-dir=' + __dirname + '/chrome_screenshot_profile',
    'about:blank'
], { stdio: 'ignore', detached: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
        }).on('error', reject);
    });
}

async function main() {
    await sleep(2000);
    const targets = await fetchJSON(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const page = targets.find(t => t.type === 'page');
    const WebSocket = require('ws');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    
    let msgId = 1;
    const pending = {};
    
    function send(method, params = {}) {
        return new Promise((resolve) => {
            const id = msgId++;
            pending[id] = { resolve };
            ws.send(JSON.stringify({ id, method, params }));
        });
    }
    
    ws.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.id && pending[msg.id]) {
            pending[msg.id].resolve(msg.result || msg.error);
            delete pending[msg.id];
        }
    });
    
    await new Promise(r => ws.on('open', r));
    
    await send('Page.enable');
    await send('Page.navigate', { url: TARGET_URL });
    
    console.log('Waiting 20 seconds for full load...');
    await sleep(20000);
    
    // Take screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    if (screenshot.data) {
        const buf = Buffer.from(screenshot.data, 'base64');
        fs.writeFileSync(__dirname + '/current_ui_screenshot.png', buf);
        console.log('Screenshot saved to current_ui_screenshot.png');
    }
    
    // Also get the full page HTML
    const htmlResult = await send('Runtime.evaluate', {
        expression: 'document.documentElement.outerHTML.substring(0, 5000)',
        returnByValue: true
    });
    if (htmlResult.result) {
        fs.writeFileSync(__dirname + '/current_page_html.txt', htmlResult.result.value);
        console.log('Page HTML saved to current_page_html.txt');
    }
    
    ws.close();
    chrome.kill();
    process.exit(0);
}

main().catch(e => { console.error(e); try { chrome.kill(); } catch(e2) {} process.exit(1); });
