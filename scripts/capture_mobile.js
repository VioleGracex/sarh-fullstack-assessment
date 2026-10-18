const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
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
      console.log("Targets found:", targets.map(t => ({ type: t.type, url: t.url })));
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
  const tempProfile = path.join(require('os').tmpdir(), 'chrome_cdp_' + Date.now());
  const { execSync } = require('child_process');
  execSync(`Start-Process -FilePath "${CHROME_PATH}" -ArgumentList "--headless=new", "--remote-debugging-port=${PORT}", "--remote-allow-origins=*", "--user-data-dir=${tempProfile}", "http://127.0.0.1:5173"`, { shell: 'powershell.exe' });

  try {
    const wsUrl = await getDebuggerUrl();
    console.log("Connected to Chrome via CDP:", wsUrl);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("Runtime.enable");

    // Force iPhone 15 Pro mobile viewport dimensions
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 393,
      height: 852,
      deviceScaleFactor: 2,
      mobile: true,
      fitWindow: false
    });

    console.log("Waiting for data to load and render...");
    await sleep(2500);

    // 1. Capture Main Console (Midnight Obsidian)
    console.log("Capturing 01-mobile-console-dark.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "01-mobile-console-dark.png"));

    // 1b. Scroll down 500px to test sticky filter controls and floating operations dock
    console.log("Scrolling down 500px to test sticky controls and floating dock...");
    await client.evaluate(`window.scrollTo({ top: 500, behavior: 'instant' });`);
    await sleep(400);
    console.log("Capturing 01b-mobile-console-scrolled-dark.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "01b-mobile-console-scrolled-dark.png"));

    // Scroll back to top
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' });`);
    await sleep(200);

    // 2. Open Order Detail Drawer (Click first mobile order card)
    console.log("Opening Order Detail Bottom Sheet...");
    await client.evaluate(`
      const card = document.querySelector('.mobile-order-card');
      if (card) card.click();
    `);
    await sleep(600);
    console.log("Capturing 02-mobile-order-detail.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "02-mobile-order-detail.png"));

    // Close Order Detail Drawer
    console.log("Closing Order Detail Bottom Sheet...");
    const closeRes1 = await client.evaluate(`(() => {
      const closeBtn = document.querySelector('.drawer-overlay.open .btn-close-drawer') || 
                       Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back to Console'));
      if (closeBtn) {
        closeBtn.click();
        return 'clicked closeBtn in detail drawer';
      }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return 'dispatched escape for detail drawer';
    })()`);
    console.log("Detail close result:", closeRes1);
    await sleep(900);

    // 3. Open Create Order Drawer (Click FAB)
    console.log("Opening Create Order Bottom Sheet via FAB...");
    await client.evaluate(`
      const fab = document.querySelector('.mobile-fab-register');
      if (fab) fab.click();
    `);
    await sleep(800);
    console.log("Capturing 03-mobile-create-order.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "03-mobile-create-order.png"));

    // Close Create Order Drawer
    console.log("Closing Create Order Bottom Sheet...");
    const closeRes2 = await client.evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const closeBtn = Array.from(document.querySelectorAll('.drawer-overlay.open button')).find(b => b.textContent.includes('Cancel') || b.className.includes('btn-close-drawer'));
      if (closeBtn) closeBtn.click();
      return 'closed create order drawer';
    })()`);
    console.log("Create close result:", closeRes2);
    await sleep(900);

    // 4. Toggle to Corporate Steel (Light Mode)
    console.log("Toggling to Light Mode...");
    await client.evaluate(`
      const themeBtn = document.querySelector('.mobile-theme-toggle-btn');
      if (themeBtn) themeBtn.click();
    `);
    await sleep(500);
    console.log("Capturing 04-mobile-console-light.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "04-mobile-console-light.png"));

    // 4b. Scroll down 500px in Light Mode to verify sticky controls and floating dock in Light Mode
    console.log("Scrolling down 500px in Light Mode...");
    await client.evaluate(`window.scrollTo({ top: 500, behavior: 'instant' });`);
    await sleep(400);
    console.log("Capturing 04b-mobile-console-scrolled-light.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "04b-mobile-console-scrolled-light.png"));

    // Scroll back to top
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' });`);
    await sleep(200);

    // 5. Open User Menu Dropdown on Mobile
    console.log("Opening User Menu on Mobile...");
    await client.evaluate(`
      const userBtn = document.querySelector('.user-profile');
      if (userBtn) userBtn.click();
    `);
    await sleep(400);
    console.log("Capturing 05-mobile-user-menu.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "05-mobile-user-menu.png"));

    // 6. Sign Out to capture Mobile Login Page
    console.log("Signing out to capture Mobile Login Page...");
    await client.evaluate(`
      const logoutBtn = Array.from(document.querySelectorAll('.dropdown-item, button')).find(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout'));
      if (logoutBtn) logoutBtn.click();
      else {
        localStorage.setItem('sarh_logged_out', 'true');
        location.reload();
      }
    `);
    await sleep(1000);
    console.log("Capturing 06-mobile-login-page.png...");
    await client.captureScreenshot(path.join(SCREENSHOT_DIR, "06-mobile-login-page.png"));

    client.close();
    console.log("All screenshots captured successfully!");
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
