const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9223;
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/json`);
      const targets = await res.json();
      const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173'));
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        return pageTarget.webSocketDebuggerUrl;
      }
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Could not find page target in Chrome debugger");
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expr) {
    const res = await this.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    return res.result?.value;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(res.data, "base64");
    fs.writeFileSync(outputPath, buffer);
    console.log(`Saved screenshot: ${outputPath} (${buffer.length} bytes)`);
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function run() {
  console.log("Launching headless Chrome on port", PORT);
  const tempProfile = path.join(require('os').tmpdir(), 'chrome_cdp_qr_' + Date.now());
  execSync(`Start-Process -FilePath "${CHROME_PATH}" -ArgumentList "--headless=new", "--remote-debugging-port=${PORT}", "--remote-allow-origins=*", "--user-data-dir=${tempProfile}", "http://127.0.0.1:5173"`, { shell: 'powershell.exe' });

  try {
    const wsUrl = await getDebuggerUrl();
    console.log("Connected to Chrome via CDP:", wsUrl);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("Runtime.enable");

    // Desktop viewport
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 2,
      mobile: false,
      fitWindow: false
    });

    console.log("Waiting for console to load...");
    await sleep(2500);

    // 1. Click "Connect Mobile (Wi-Fi QR)" in top toolbar
    console.log("Opening Connect Mobile Modal on Desktop...");
    const clicked = await client.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Connect Mobile'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);
    console.log("Clicked Connect Mobile button:", clicked);
    await sleep(800);

    console.log("Capturing 07-desktop-qr-modal-dark.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "07-desktop-qr-modal-dark.png"));

    // 2. Toggle to Light Mode while modal is open
    console.log("Toggling theme to Corporate Steel...");
    await client.evaluate(`(() => {
      document.documentElement.setAttribute('data-theme', 'corporate-steel');
    })()`);
    await sleep(500);

    console.log("Capturing 08-desktop-qr-modal-light.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "08-desktop-qr-modal-light.png"));

    client.close();
    console.log("QR Modal screenshots captured successfully!");
  } finally {
    try {
      execSync(`Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Application\\chrome.exe*" } | Stop-Process -Force`, { shell: 'powershell.exe' });
    } catch {}
  }
}

run().catch(err => {
  console.error("Capture failed:", err);
  process.exit(1);
});
