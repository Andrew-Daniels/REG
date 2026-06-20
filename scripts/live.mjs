import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:8787';

const browser = await chromium.launch({
  executablePath: '/tmp/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

async function mobile() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  return ctx.newPage();
}
const shot = async (p, n) => { await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n); };

// HOST opens a big-screen lobby
const host = await mobile();
await host.goto(BASE, { waitUntil: 'networkidle' });
await host.getByText('Big Screen Party').click();
await host.getByRole('button', { name: /Open lobby/ }).click();
await host.waitForTimeout(1000);
await shot(host, '10-lobby-host');

// Read the lobby code off the host screen
const code = (await host.locator('.code').first().innerText()).trim();
console.log('lobby code:', code);

// Two players join
const players = [];
for (const name of ['Ann', 'Bob']) {
  const p = await mobile();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.getByText('Join a Lobby').click();
  await p.locator('input').first().fill(code);
  await p.locator('input').nth(1).fill(name);
  await p.getByRole('button', { name: /Join game/ }).click();
  await p.waitForTimeout(600);
  players.push(p);
}
await shot(players[0], '11-player-waiting');
await host.waitForTimeout(600);
await shot(host, '12-lobby-filled');

// Host starts the game
await host.getByRole('button', { name: /Start game/ }).click();
await host.waitForTimeout(1200);
await shot(host, '13-host-stage');

// Each player locks in a guess
for (const p of players) {
  await p.waitForTimeout(800);
  const lock = p.getByRole('button', { name: /Lock in/ });
  if (await lock.count()) await lock.first().click();
  await p.waitForTimeout(400);
}
await shot(players[0], '14-player-lockedin');
await host.waitForTimeout(1000);
await shot(host, '15-host-reveal');

const ok = (await host.locator('text=Actual price').count()) > 0;
console.log('host reached reveal with actual price:', ok);

await browser.close();
console.log('done');
