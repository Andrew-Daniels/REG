import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:5173';

const browser = await chromium.launch({
  executablePath: '/tmp/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, // iPhone 12/13 logical size
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });

async function shot(name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}

await page.goto(BASE, { waitUntil: 'networkidle' });
await shot('01-home');

// Party setup
await page.getByText('Party Game').click();
await shot('02-party-setup');

// Switch to hard preset to show fewer chips
await page.getByRole('button', { name: 'Hard' }).click();
await shot('03-setup-hard');

// Tee off into the game
await page.getByRole('button', { name: /Tee off/ }).click();
await page.waitForTimeout(1500); // allow map tiles + photo
await shot('04-game-guess');

// Lock in a guess -> reveal
await page.getByRole('button', { name: /Lock in/ }).click();
await page.waitForTimeout(800);
await shot('05-reveal');

// Next holes to completion (5 holes default) — single player
for (let i = 0; i < 5; i++) {
  const next = page.getByRole('button', { name: /Next hole|final scorecard/i });
  if (await next.count()) {
    await next.first().click();
    await page.waitForTimeout(900);
    const lock = page.getByRole('button', { name: /Lock in/ });
    if (await lock.count()) { await lock.first().click(); await page.waitForTimeout(700); }
  }
}
await shot('06-scorecard');

// Daily challenge
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Daily Challenge').click();
await page.waitForTimeout(1200);
await shot('07-daily');

// Play by text
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Play by Text').click();
await shot('08-text-setup');
await page.getByRole('button', { name: /Create match/ }).click();
await page.waitForTimeout(1200);
await shot('09-text-turn');

await browser.close();
console.log('done');
