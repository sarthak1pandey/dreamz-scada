/**
 * diagnose_console.js - Capture browser console errors when loading the app
 * Uses Chrome DevTools Protocol via headless Chrome
 */
const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://127.0.0.1:1881/';
const DEBUG_PORT = 9224;

// Kill any existing Chrome debug instances
try { execSync('taskkill /f /im chrome.exe 2>nul', { stdio: 'ignore' }); } catch(e) {}

console.log('Starting Chrome headless...');
const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-web-security',
    '--user-data-dir=' + __dirname + '/chrome_diag_profile',
    'about:blank'
], { stdio: 'ignore', detached: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function main() {
    await sleep(2000);
    
    // Get debug target
    let targets;
    try {
        targets = await fetchJSON(`http://127.0.0.1:${DEBUG_PORT}/json`);
    } catch(e) {
        console.error('Cannot connect to Chrome DevTools:', e.message);
        process.exit(1);
    }
    
    const page = targets.find(t => t.type === 'page');
    if (!page) {
        console.error('No page target found');
        process.exit(1);
    }
    
    const wsUrl = page.webSocketDebuggerUrl;
    console.log('Connecting to:', wsUrl);
    
    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);
    
    let msgId = 1;
    const pending = {};
    const consoleMessages = [];
    const errors = [];
    const networkErrors = [];
    
    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = msgId++;
            pending[id] = { resolve, reject };
            ws.send(JSON.stringify({ id, method, params }));
        });
    }
    
    ws.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.id && pending[msg.id]) {
            pending[msg.id].resolve(msg.result || msg.error);
            delete pending[msg.id];
        }
        if (msg.method === 'Runtime.consoleAPICalled') {
            const args = (msg.params.args || []).map(a => a.value || a.description || a.type).join(' ');
            const entry = `[${msg.params.type}] ${args}`;
            consoleMessages.push(entry);
            console.log('  CONSOLE:', entry);
        }
        if (msg.method === 'Runtime.exceptionThrown') {
            const ex = msg.params.exceptionDetails;
            const text = ex.exception?.description || ex.text || JSON.stringify(ex);
            errors.push(text);
            console.log('  ERROR:', text);
        }
        if (msg.method === 'Network.loadingFailed') {
            networkErrors.push(`${msg.params.type}: ${msg.params.errorText} - ${msg.params.blockedReason || ''}`);
            console.log('  NETWORK FAIL:', msg.params.errorText);
        }
        if (msg.method === 'Network.responseReceived') {
            const resp = msg.params.response;
            if (resp.status >= 400) {
                networkErrors.push(`HTTP ${resp.status}: ${resp.url}`);
                console.log(`  HTTP ERROR: ${resp.status} ${resp.url}`);
            }
        }
    });
    
    await new Promise(r => ws.on('open', r));
    console.log('WebSocket connected');
    
    // Enable domains
    await send('Runtime.enable');
    await send('Console.enable');
    await send('Network.enable');
    await send('Page.enable');
    
    // Navigate to the app
    console.log(`Navigating to ${TARGET_URL}...`);
    await send('Page.navigate', { url: TARGET_URL });
    
    // Wait for page to load and Angular to bootstrap (or fail)
    console.log('Waiting 15 seconds for Angular to bootstrap...');
    await sleep(15000);
    
    // Check if Angular bootstrapped
    const result = await send('Runtime.evaluate', {
        expression: `JSON.stringify({
            appRoot: document.querySelector('app-root')?.innerHTML?.substring(0, 200),
            angularVersion: window.ng?.coreTokens ? 'detected' : 'not-detected',
            title: document.title,
            bodyChildren: document.body.children.length,
            scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || '(inline)'),
            errorElements: document.querySelectorAll('.error, [class*=error]').length
        })`,
        returnByValue: true
    });
    
    console.log('\n=== PAGE STATE ===');
    if (result.result) {
        try {
            const state = JSON.parse(result.result.value);
            console.log(JSON.stringify(state, null, 2));
        } catch(e) {
            console.log(result.result.value);
        }
    }
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(m => console.log(m));
    
    console.log('\n=== JAVASCRIPT ERRORS ===');
    errors.forEach(e => console.log(e));
    
    console.log('\n=== NETWORK ERRORS ===');
    networkErrors.forEach(e => console.log(e));
    
    // Write full diagnostics to file
    const report = {
        consoleMessages,
        errors,
        networkErrors,
        pageState: result.result?.value
    };
    fs.writeFileSync(__dirname + '/diagnostic_report.json', JSON.stringify(report, null, 2));
    console.log('\nFull report saved to diagnostic_report.json');
    
    ws.close();
    chrome.kill();
    process.exit(0);
}

main().catch(e => {
    console.error('Fatal:', e);
    try { chrome.kill(); } catch(e2) {}
    process.exit(1);
});
