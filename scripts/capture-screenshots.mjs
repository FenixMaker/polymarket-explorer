import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'docs', 'screenshots');
const baseUrl = 'http://localhost:3000';

async function capture(page, name, options = {}) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false, ...options });
  console.log(`Saved ${file}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('arena_onboarding_done', '1');
  });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.getByRole('button', { name: /Pular|Começar/i }).click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await capture(page, '01-dashboard-light');

  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  });
  await page.waitForTimeout(800);
  await capture(page, '02-dashboard-dark');

  const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
  if (await searchInput.count()) {
    await searchInput.fill('Copa do Mundo');
    await searchInput.press('Enter');
    await page.waitForTimeout(4000);
    await capture(page, '03-search-results');
  }

  const marketCard = page.getByText('Campeão da Copa do Mundo').first();
  if (await marketCard.count()) {
    await marketCard.click();
    await page.waitForTimeout(3000);
    await capture(page, '04-event-details');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  const ucdbTab = page.getByRole('button', { name: /UCDB/i }).first();
  if (await ucdbTab.count()) {
    await ucdbTab.click();
    await page.waitForTimeout(2500);
    await capture(page, '05-ucdb-markets');
  }

  const favoritesTab = page.getByRole('button', { name: /Favoritos/i }).first();
  if (await favoritesTab.count()) {
    await favoritesTab.click();
    await page.waitForTimeout(1500);
    await capture(page, '06-favorites');
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
