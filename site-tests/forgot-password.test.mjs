import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/forgot-password.html', import.meta.url), 'utf8');
const firebase = readFileSync(new URL('../public/assets/js/firebase.js', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const handler = scripts.find(([, attrs, body]) => attrs.includes('type="module"') && body.includes('window.handleReset'))?.[2];

function fixture(sendPasswordResetEmail) {
  const auth = Object.freeze({ fixture: 'shared-auth' });
  const alerts = [];
  const button = { disabled: false };
  const input = { value: 'reset-fixture@example.invalid' };
  const form = { querySelector(selector) {
    if (selector === 'input[type="email"]') return input;
    if (selector === 'button[type="submit"]') return button;
    throw new Error(`Unexpected selector: ${selector}`);
  } };
  const window = { location: { href: '/forgot-password/' } };
  let prevented = 0;
  const context = vm.createContext({ window, auth, sendPasswordResetEmail, alert: value => alerts.push(value) });
  // Execute the actual page handler with injected SDK bindings; never import a network SDK.
  const executable = handler.replace(/import\s*\{[^}]+\}\s*from\s*"[^"]+"\s*;/g, '');
  vm.runInContext(executable, context);
  return { auth, alerts, button, input, window, submit: () => window.handleReset({ target: form, preventDefault() { prevented++; } }), prevented: () => prevented };
}

test('reset page resolves shell and exact pinned SDK dependencies without reinitialization', () => {
  assert.ok(handler);
  assert.doesNotMatch(html, /firebase-["']/);
  assert.doesNotMatch(html, /src=["']\/?assets\/js\/?["']/);
  assert.match(html, /<script src="\/assets\/js\/includes\.js"><\/script>/);
  assert.match(handler, /import \{ auth \} from "\/assets\/js\/firebase\.js";/);
  assert.match(handler, /import \{ sendPasswordResetEmail \}\s*from "https:\/\/www\.gstatic\.com\/firebasejs\/9\.23\.0\/firebase-auth\.js";/);
  assert.match(firebase, /firebasejs\/9\.23\.0\/firebase-auth\.js/);
  assert.doesNotMatch(handler, /\b(?:initializeApp|getAuth|initializeAuth)\s*\(/);
});

test('both login destinations are root-relative under raw and clean page URLs', () => {
  const visible = html.match(/href="([^"]+)">Back to login/)[1];
  const success = handler.match(/window\.location\.href = "([^"]+)"/)[1];
  for (const base of ['https://fixture.invalid/forgot-password/', 'https://fixture.invalid/forgot-password.html']) {
    for (const destination of [visible, success]) {
      assert.equal(destination, '/login/');
      assert.equal(new URL(destination, base).pathname, '/login/');
    }
  }
  assert.doesNotMatch(html, /["']login\.html["']/);
});

test('email form preserves labelled native validation and keyboard submit', () => {
  assert.match(html, /<form[^>]+onsubmit="handleReset\(event\)"/);
  assert.match(html, /<label>\s*Registered Email\s*<input type="email"[^>]+required>/);
  assert.match(html, /<button[^>]+type="submit"/);
});

test('mocked success uses shared auth and entered email, then returns to login', async () => {
  const calls = [];
  const f = fixture(async (...args) => calls.push(args));
  await f.submit();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], f.auth);
  assert.equal(calls[0][1], 'reset-fixture@example.invalid');
  assert.equal(f.prevented(), 1);
  assert.deepEqual(f.alerts, ['Password reset link sent. Please check your email.']);
  assert.equal(f.window.location.href, '/login/');
  assert.equal(f.button.disabled, false);
});

test('in-flight request prevents duplicate sending and restores button', async () => {
  let resolve;
  let calls = 0;
  const f = fixture(() => { calls++; return new Promise(r => { resolve = r; }); });
  const pending = f.submit();
  assert.equal(f.button.disabled, true);
  await f.submit();
  assert.equal(calls, 1);
  resolve();
  await pending;
  assert.equal(f.button.disabled, false);
});

test('failure hides internal details and allows corrected-email retry', async () => {
  const calls = [];
  const f = fixture(async (...args) => {
    calls.push(args);
    if (calls.length === 1) throw new Error('Firebase internal-project-secret auth/user-not-found');
  });
  await f.submit();
  assert.equal(f.window.location.href, '/forgot-password/');
  assert.equal(f.button.disabled, false);
  assert.deepEqual(f.alerts, ['Unable to send a reset link. Please check your email address and try again.']);
  assert.doesNotMatch(f.alerts[0], /Firebase|internal-project-secret|user-not-found/);
  f.input.value = 'corrected-fixture@example.invalid';
  await f.submit();
  assert.equal(calls[1][1], 'corrected-fixture@example.invalid');
  assert.equal(f.window.location.href, '/login/');
  assert.equal(f.button.disabled, false);
});

test('synchronous SDK failure also leaves form recoverable', async () => {
  const f = fixture(() => { throw new Error('fixture failure'); });
  await f.submit();
  assert.equal(f.button.disabled, false);
  assert.equal(f.window.location.href, '/forgot-password/');
});

// Opt-in localhost browser acceptance. Requires an already installed Playwright/Chromium.
// RESET_BROWSER_QA=1 node --test site-tests/forgot-password.test.mjs
// RESET_CHROMIUM_PATH may point to an existing executable. No real reset email is sent.
test('localhost browser reset journey with intercepted Firebase SDK', { skip: process.env.RESET_BROWSER_QA !== '1' }, async () => {
  const { createRequire } = await import('node:module');
  const { createServer } = await import('node:http');
  const { readFile, stat } = await import('node:fs/promises');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { chromium } = createRequire(import.meta.url)('playwright');
  const root = fileURLToPath(new URL('../public/', import.meta.url));
  const server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      let file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
      catch { file = file.replace(/\/$/, '') + '.html'; }
      const bytes = await readFile(file);
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
      res.end(bytes);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.RESET_CHROMIUM_PATH ? { executablePath: process.env.RESET_CHROMIUM_PATH } : {}) });
    const base = `http://127.0.0.1:${server.address().port}`;
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const errors = [];
    const dialogs = [];
    const calls = [];
    let mode = 'failure';
    await context.exposeBinding('__resetFixture', (_source, email) => { calls.push(email); return mode; });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === base) {
        // Verify the destination without running the unrelated login journey.
        if (url.pathname === '/login/') return route.fulfill({ contentType: 'text/html', body: '<title>Login fixture</title>' });
        return route.continue();
      }
      const stubs = {
        'firebase-app.js': 'export const getApps=()=>[], initializeApp=()=>({});',
        'firebase-auth.js': `export const getAuth=()=>({currentUser:null}), browserLocalPersistence={}, browserSessionPersistence={};
          export const onAuthStateChanged=(auth,cb)=>{queueMicrotask(()=>cb(null));return ()=>{}};
          export const sendPasswordResetEmail=async(auth,email)=>{if(await window.__resetFixture(email)==='failure')throw Error('Private SDK detail');};
          export const createUserWithEmailAndPassword=()=>{throw Error('Forbidden test write')}, signInWithEmailAndPassword=createUserWithEmailAndPassword, signOut=createUserWithEmailAndPassword, setPersistence=createUserWithEmailAndPassword;`,
        'firebase-firestore.js': 'export const getFirestore=()=>({}),collection=()=>{},addDoc=()=>{throw Error("Forbidden test write")},doc=()=>{},setDoc=addDoc,getDoc=addDoc,serverTimestamp=()=>{};',
        'firebase-storage.js': 'export const getStorage=()=>({});'
      };
      const body = url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/9.23.0/') ? stubs[url.pathname.split('/').pop()] : null;
      if (!body) { errors.push(`Unexpected external request: ${url}`); return route.abort(); }
      return route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
    for (const route of ['/forgot-password/', '/forgot-password.html']) {
      await page.goto(base + route);
      await page.locator('#siteHeader .siteHeader').waitFor();
      await page.locator('#siteFooter .siteFooter').waitFor();
      await page.waitForFunction(() => document.body.classList.contains('auth-ready') && typeof window.handleReset === 'function');
      assert.equal(new URL(page.url()).pathname, route, 'no unrelated auth redirect');
      const email = page.getByLabel('Registered Email');
      await email.fill('reset-fixture@example.invalid');
      mode = 'failure';
      const before = calls.length;
      const failureDialog = page.waitForEvent('dialog');
      await email.press('Enter');
      await failureDialog;
      await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
      await page.getByRole('button', { name: 'Send Reset Link' }).waitFor();
      assert.equal(calls.length, before + 1);
      assert.equal(new URL(page.url()).pathname, route);
      assert.equal(await page.getByRole('button', { name: 'Send Reset Link' }).isEnabled(), true);
      assert.equal(dialogs.at(-1), 'Unable to send a reset link. Please check your email address and try again.');
      mode = 'success';
      await email.fill('corrected-fixture@example.invalid');
      await email.press('Enter');
      await page.waitForURL(base + '/login/');
      assert.equal(calls.at(-1), 'corrected-fixture@example.invalid');
      assert.equal(dialogs.at(-1), 'Password reset link sent. Please check your email.');
      await page.goto(base + route);
      await page.getByRole('link', { name: 'Back to login' }).click();
      await page.waitForURL(base + '/login/');
    }
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
