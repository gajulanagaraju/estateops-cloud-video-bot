require('dotenv').config();
const { chromium } = require('playwright');

const EMAIL = process.env.ESTATEOPS_EMAIL;
const PASSWORD = process.env.ESTATEOPS_PASSWORD;

async function smoothScroll(page, totalY = 600, steps = 20, delay = 60) {
  const step = totalY / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(delay);
  }
}

async function dismissOnboarding(page) {
  const candidates = [
    page.getByRole('button', { name: /skip/i }),
    page.getByRole('button', { name: /dismiss/i }),
    page.getByRole('button', { name: /close/i }),
    page.getByRole('button', { name: /not now/i }),
    page.getByRole('button', { name: /got it/i }),
    page.getByRole('button', { name: /continue later/i }),
    page.getByRole('button', { name: /maybe later/i }),
    page.locator('[aria-label="Close"]').first(),
    page.locator('[data-testid="close"]').first(),
    page.locator('button:has-text("Skip")').first(),
    page.locator('button:has-text("Dismiss")').first(),
    page.locator('button:has-text("Close")').first(),
  ];

  for (let round = 0; round < 5; round++) {
    let dismissed = false;
    for (const candidate of candidates) {
      try {
        if (await candidate.isVisible({ timeout: 1500 })) {
          await candidate.click();
          await page.waitForTimeout(1000);
          dismissed = true;
          break;
        }
      } catch {}
    }
    // Try Escape as fallback
    if (!dismissed) {
      try { await page.keyboard.press('Escape'); } catch {}
      await page.waitForTimeout(800);
      break;
    }
  }
}

async function clickTab(page, name) {
  // Target Radix UI tab buttons specifically — avoids matching sidebar nav links
  const tab = page.locator(`button[role="tab"]:has-text("${name}")`).first();
  await tab.waitFor({ state: 'visible', timeout: 15000 });
  await tab.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: {
      dir: 'videos/',
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  // ─── 1. LOGIN ─────────────────────────────────────────────────────────────
  await page.goto('https://estateops.cloud', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', EMAIL);
  await page.waitForTimeout(500);
  await page.fill('input[type="password"]', PASSWORD);
  await page.waitForTimeout(500);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // ─── 2. DISMISS ONBOARDING ────────────────────────────────────────────────
  await dismissOnboarding(page);

  // ─── 3. LEFT SIDEBAR — SHORT TERM RENTALS ────────────────────────────────
  const strNav = page.locator('a[href*="/str"]').first();

  await strNav.waitFor({ state: 'visible', timeout: 15000 });
  await strNav.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  // ─── 4. STR TOP TABS ──────────────────────────────────────────────────────
  const tabs = [
    'Dashboard',
    'Properties',
    'Listings',
    'Bookings',
    'Calendar',
    'Cleaning',
    'Supplies',
    'Guest Messages',
    'Maintenance',
    'Reports',
    'Settings',
  ];

  for (const tab of tabs) {
    console.log(`→ clicking tab: ${tab}`);
    await clickTab(page, tab);
    await page.mouse.move(800, 400);
    await smoothScroll(page, 400);
    await page.waitForTimeout(1500);
  }

  await context.close();
  await browser.close();
  console.log('✓ Recording complete. Check videos/');
})();
