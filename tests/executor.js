/**
 * executor.js
 *
 * Core field-interaction helpers with selector fallbacks + result logging.
 * All helpers log success/failure into the result object passed by reference.
 *
 * For form-based STR tests, Test Data column drives UI input values.
 * Steps only define sequence.
 */

const path = require('path');
const fs   = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'videos', 'tests', 'screenshots');

// ── SCREENSHOT HELPER ──────────────────────────────────────────────────────

async function screenshot(page, label) {
  const file = path.join(SCREENSHOTS_DIR, `${label}.png`);
  try { await page.screenshot({ path: file, fullPage: false }); } catch {}
  return file;
}

// ── SAFE FIELD FILL ────────────────────────────────────────────────────────
/**
 * Try each selector in order. Fill the first visible one.
 * If none match, log a missing_selector + capture screenshot.
 *
 * @param {import('playwright').Page} page
 * @param {string[]} strategies  - ordered list of CSS/text selectors
 * @param {string}   value       - value to fill
 * @param {string}   fieldName   - human label for logging
 * @param {object}   result      - result object (mutated in place)
 */
async function safeField(page, strategies, value, fieldName, result) {
  for (const sel of strategies) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 })) {
        await el.scrollIntoViewIfNeeded();
        await el.clear();
        await el.fill(String(value));
        await page.waitForTimeout(300);
        result.executed_steps.push(`✓ Filled "${fieldName}" = "${value}" [${sel}]`);
        return true;
      }
    } catch {}
  }
  // Nothing matched
  result.missing_selectors.push(fieldName);
  result.warnings.push(`No selector matched for field: ${fieldName}`);
  const ss = await screenshot(page, `${result.test_case_id}-missing-${fieldName.replace(/\s+/g, '-')}`);
  result.executed_steps.push(`✗ MISSING SELECTOR for "${fieldName}" — screenshot: ${ss}`);
  console.warn(`    ⚠ Missing selector: ${fieldName}`);
  return false;
}

// ── SAFE SELECT (dropdown) ─────────────────────────────────────────────────
/**
 * Try each selector, then try selectOption or click-based approach.
 */
async function safeSelect(page, strategies, value, fieldName, result) {
  for (const sel of strategies) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 })) {
        await el.scrollIntoViewIfNeeded();
        // Native <select>
        try {
          await el.selectOption({ label: value });
          result.executed_steps.push(`✓ Selected "${fieldName}" = "${value}" [${sel}]`);
          await page.waitForTimeout(400);
          return true;
        } catch {}
        // Combobox / custom select — type + pick from dropdown
        try {
          await el.fill(value);
          await page.waitForTimeout(600);
          const option = page.locator(`[role="option"]:has-text("${value}")`).first();
          if (await option.isVisible({ timeout: 3000 })) {
            await option.click();
            result.executed_steps.push(`✓ Selected "${fieldName}" = "${value}" via combobox [${sel}]`);
            await page.waitForTimeout(400);
            return true;
          }
        } catch {}
      }
    } catch {}
  }
  result.missing_selectors.push(fieldName);
  result.warnings.push(`No selector matched for select: ${fieldName}`);
  const ss = await screenshot(page, `${result.test_case_id}-missing-${fieldName.replace(/\s+/g, '-')}`);
  result.executed_steps.push(`✗ MISSING SELECTOR for "${fieldName}" — screenshot: ${ss}`);
  console.warn(`    ⚠ Missing selector: ${fieldName}`);
  return false;
}

// ── SAFE CHECK (checkbox / toggle) ────────────────────────────────────────
/**
 * Find a checkbox or toggle by label text and check it.
 */
async function safeCheck(page, labelText, fieldName, result) {
  const strategies = [
    `label:has-text("${labelText}") input[type="checkbox"]`,
    `label:has-text("${labelText}") input[type="radio"]`,
    `[aria-label="${labelText}"]`,
    `input[value="${labelText}"]`,
    `button:has-text("${labelText}")`,
    `[data-channel="${labelText.toLowerCase()}"]`,
    `[data-value="${labelText.toLowerCase()}"]`,
  ];
  for (const sel of strategies) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 })) {
        await el.scrollIntoViewIfNeeded();
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        if (tag === 'input') {
          const checked = await el.isChecked();
          if (!checked) await el.check();
        } else {
          await el.click();
        }
        await page.waitForTimeout(400);
        result.executed_steps.push(`✓ Checked "${fieldName}" = "${labelText}" [${sel}]`);
        return true;
      }
    } catch {}
  }
  result.missing_selectors.push(fieldName);
  result.warnings.push(`No checkbox/toggle found for: ${fieldName} (${labelText})`);
  const ss = await screenshot(page, `${result.test_case_id}-missing-${fieldName.replace(/\s+/g, '-')}`);
  result.executed_steps.push(`✗ MISSING SELECTOR for checkbox "${fieldName}" — screenshot: ${ss}`);
  console.warn(`    ⚠ Missing checkbox: ${fieldName}`);
  return false;
}

// ── SAFE CLICK ─────────────────────────────────────────────────────────────
async function safeClick(page, strategies, label, result, timeout = 6000) {
  const list = Array.isArray(strategies) ? strategies : [strategies];
  for (const sel of list) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout })) {
        await el.scrollIntoViewIfNeeded();
        await el.click();
        await page.waitForTimeout(800);
        result.executed_steps.push(`✓ Clicked "${label}" [${sel}]`);
        return true;
      }
    } catch {}
  }
  result.warnings.push(`Could not click: ${label}`);
  result.executed_steps.push(`✗ Could not click "${label}"`);
  console.warn(`    ⚠ Could not click: ${label}`);
  return false;
}

// ── RESULT SKELETON ────────────────────────────────────────────────────────
function makeResult(row) {
  return {
    test_case_id:         row.id,
    test_name:            row.title,
    priority:             row.priority,
    type:                 row.type,
    preconditions:        row.preconditions,
    steps:                row.steps,
    expected_result:      row.expectedResult,
    parsed_data:          row.testData,
    run_timestamp:        new Date().toISOString(),
    executed_steps:       [],
    verification_results: {},
    missing_selectors:    [],
    warnings:             [],
    screenshots:          {},
    video_path:           '',
    pass_fail:            'PASS',
    error:                '',
  };
}

// ── SAVE RESULT JSON ───────────────────────────────────────────────────────
function saveResult(result) {
  const dir  = path.join(__dirname, '..', 'videos', 'tests', 'results');
  const file = path.join(dir, `${result.test_case_id}-result.json`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  return file;
}

module.exports = { safeField, safeSelect, safeCheck, safeClick, screenshot, makeResult, saveResult };
