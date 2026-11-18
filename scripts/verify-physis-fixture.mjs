#!/usr/bin/env node
// Browser verification of the deployed playground (first-milestone receipt).
// Usage: node scripts/verify-physis-fixture.mjs [base-url]
// Requires: system chromium; @playwright/test (devDependency).
import { chromium } from '@playwright/test';

const base = process.argv[2] || 'https://ilpez00.github.io/physis-playground/';
const outDir = process.argv[3] || 'receipts';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
// Dismiss the first-visit guided tour before any navigation mounts it.
await page.addInitScript(() =>
  localStorage.setItem('ontology-quest-tour-dismissed', 'true'));
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

let failed = 0;
const check = (name, ok) => { console.log(`${ok ? 'OK ' : 'FAIL'} ${name}`); if (!ok) failed++; };

// 1. Home loads with Physis branding
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
check('home title is Physis World Model Playground',
  (await page.title()).includes('Physis World Model Playground'));
await page.screenshot({ path: `${outDir}/pg-home.png` });

// 2. The Physis fixture loads from the catalogue and renders the graph
await page.goto(`${base}#/catalogue`, { waitUntil: 'networkidle', timeout: 60000 })
  .catch(() => {});
await page.waitForTimeout(3000);
await page.locator('.gallery-grid >> text=Physis World Model').first()
  .click({ timeout: 20000 });
await page.waitForTimeout(5000);
const c = await page.content();
check('fixture lists Printer', c.includes('Printer'));
check('fixture lists Print-Job', c.includes('Print-Job'));
check('fixture lists Inventory-Item', c.includes('Inventory-Item'));
check('fixture lists Location', c.includes('Location'));
check('fixture lists Observation', c.includes('Observation'));
check('graph canvas rendered', (await page.locator('canvas').count()) > 0);
await page.screenshot({ path: `${outDir}/pg-physis.png` });

// 3. The three lessons exist and the first one embeds the fixture
await page.goto(`${base}#/learn`, { waitUntil: 'networkidle', timeout: 60000 })
  .catch(() => {});
await page.waitForTimeout(2500);
check('Physis path listed', (await page.content()).includes('The Physis World Model'));
await page.locator('text=The Physis World Model').first().click();
await page.waitForTimeout(2000);
await page.locator('text=Read article').first().click();
await page.waitForTimeout(4000);
check('lesson 1 content renders', (await page.content()).includes('Facts have sources'));
check('lesson embed slot present', (await page.locator('.learn-embed-slot').count()) === 1);
check('lesson embed renders canvases',
  (await page.locator('.learn-embed-slot canvas').count()) > 0);
check('no embed error', (await page.locator('.learn-embed-error').count()) === 0);
await page.screenshot({ path: `${outDir}/pg-lesson1.png` });

check('no console/page errors', errors.length === 0);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
await browser.close();
process.exit(failed ? 1 : 0);
