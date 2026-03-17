require('dotenv').config();

const EMAIL = process.env.ESTATEOPS_EMAIL;
const PASSWORD = process.env.ESTATEOPS_PASSWORD;

async function login(page) {
  await page.goto('https://estateops.cloud', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', EMAIL);
  await page.waitForTimeout(400);
  await page.fill('input[type="password"]', PASSWORD);
  await page.waitForTimeout(400);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);
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
    page.locator('button:has-text("Skip")').first(),
    page.locator('button:has-text("Dismiss")').first(),
  ];
  for (let round = 0; round < 5; round++) {
    let dismissed = false;
    for (const c of candidates) {
      try {
        if (await c.isVisible({ timeout: 1200 })) {
          await c.click();
          await page.waitForTimeout(800);
          dismissed = true;
          break;
        }
      } catch {}
    }
    if (!dismissed) {
      try { await page.keyboard.press('Escape'); } catch {}
      break;
    }
  }
  await page.waitForTimeout(500);
}

async function navigateToSTR(page) {
  const strNav = page.locator('a[href*="/str"]').first();
  await strNav.waitFor({ state: 'visible', timeout: 15000 });
  await strNav.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

async function clickTab(page, name) {
  const tab = page.locator(`button[role="tab"]:has-text("${name}")`).first();
  await tab.waitFor({ state: 'visible', timeout: 15000 });
  await tab.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

async function smoothScroll(page, totalY = 600, steps = 20, delay = 60) {
  const step = totalY / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(delay);
  }
}

// Try to click a button, skip if not found
async function tryClick(page, selector, timeout = 5000) {
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout });
    await el.click();
    await page.waitForTimeout(1000);
    return true;
  } catch { return false; }
}

// Fill a field if it exists
async function tryFill(page, selector, value, timeout = 4000) {
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout });
    await el.fill(value);
    await page.waitForTimeout(300);
    return true;
  } catch { return false; }
}

module.exports = { login, dismissOnboarding, navigateToSTR, clickTab, smoothScroll, tryClick, tryFill };
