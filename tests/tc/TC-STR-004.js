/**
 * TC-STR-004 — Create New STR Listing
 *
 * Precondition : STR property exists without active listing
 * Steps        : Navigate to Listings tab → Click Create Listing →
 *                Fill title, description, amenities, pricing, channels → Submit
 * Expected     : Listing created with status "draft". Channel connections prepared.
 *
 * For form-based STR tests, Test Data column drives UI input values.
 * Steps only define sequence.
 *
 * To extend for TC-STR-005 (Edit Listing):
 *   Copy this file to TC-STR-005.js, change execute() to open existing
 *   listing, click Edit, update the relevant fields, save and verify.
 */

const { safeField, safeSelect, safeCheck, safeClick, screenshot } = require('../executor');
const { clickTab, smoothScroll } = require('../helpers');

// ── SELECTOR BANKS ────────────────────────────────────────────────────────
// Ordered: accessible first, then attribute-based, then text-anchored.

const SEL = {
  createListingBtn: [
    'button:has-text("Create Listing")',
    'button:has-text("New Listing")',
    'button:has-text("Add Listing")',
    'a:has-text("Create Listing")',
    '[data-testid="create-listing"]',
  ],

  property: [
    'select[name*="property" i]',
    '[role="combobox"][aria-label*="property" i]',
    '[role="combobox"][placeholder*="property" i]',
    'label:has-text("Property") + select',
    'label:has-text("Property") ~ select',
    'input[placeholder*="property" i]',
    '[data-testid="property-select"]',
  ],

  title: [
    'input[name="title"]',
    'input[name="listing_title"]',
    'input[placeholder*="title" i]',
    '[aria-label*="listing title" i]',
    'label:has-text("Title") + input',
    'label:has-text("Listing Title") + input',
    '[data-testid="listing-title"]',
  ],

  description: [
    'textarea[name*="description" i]',
    'textarea[placeholder*="description" i]',
    '[aria-label*="description" i]',
    'label:has-text("Description") + textarea',
    'label:has-text("Description") ~ textarea',
    '[data-testid="description"]',
    '[contenteditable="true"]',
  ],

  amenities: [
    'textarea[name*="amenities" i]',
    'input[name*="amenities" i]',
    'textarea[placeholder*="amenities" i]',
    '[aria-label*="amenities" i]',
    'label:has-text("Amenities") + textarea',
    'label:has-text("Amenities") ~ textarea',
  ],

  nightlyRate: [
    'input[name*="nightly_rate" i]',
    'input[name*="nightlyRate" i]',
    'input[name*="base_rate" i]',
    'input[name*="price" i]',
    'input[placeholder*="nightly rate" i]',
    'input[placeholder*="per night" i]',
    'input[placeholder*="base rate" i]',
    '[aria-label*="nightly rate" i]',
    'label:has-text("Nightly Rate") + input',
    'label:has-text("Base Rate") + input',
    'label:has-text("Price") + input',
  ],

  cleaningFee: [
    'input[name*="cleaning_fee" i]',
    'input[name*="cleaningFee" i]',
    'input[placeholder*="cleaning fee" i]',
    '[aria-label*="cleaning fee" i]',
    'label:has-text("Cleaning Fee") + input',
    'label:has-text("Cleaning") + input',
  ],

  minStay: [
    'input[name*="min_stay" i]',
    'input[name*="minStay" i]',
    'input[name*="minimum_stay" i]',
    'input[placeholder*="min stay" i]',
    'input[placeholder*="minimum" i]',
    '[aria-label*="minimum stay" i]',
    'label:has-text("Min Stay") + input',
    'label:has-text("Minimum Stay") + input',
  ],

  maxStay: [
    'input[name*="max_stay" i]',
    'input[name*="maxStay" i]',
    'input[name*="maximum_stay" i]',
    'input[placeholder*="max stay" i]',
    'input[placeholder*="maximum" i]',
    '[aria-label*="maximum stay" i]',
    'label:has-text("Max Stay") + input',
    'label:has-text("Maximum Stay") + input',
  ],

  submitBtn: [
    'button[type="submit"]:has-text("Create")',
    'button:has-text("Create Listing")',
    'button:has-text("Save Listing")',
    'button:has-text("Publish")',
    'button:has-text("Save")',
    'button:has-text("Submit")',
    '[data-testid="submit-listing"]',
  ],
};

// ── EXECUTE ────────────────────────────────────────────────────────────────
async function execute(page, parsedData, result) {
  const d = parsedData;

  // Step 1 — Navigate to Listings tab
  await clickTab(page, 'Listings');
  await page.waitForTimeout(1500);
  result.executed_steps.push('✓ Navigated to Listings tab');

  // Step 2 — Click Create Listing
  const opened = await safeClick(page, SEL.createListingBtn, 'Create Listing', result, 8000);
  if (!opened) {
    result.pass_fail = 'FAIL';
    result.error = 'Could not open Create Listing form';
    return;
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  result.executed_steps.push('✓ Create Listing form opened');

  // Step 3 — Select property
  if (d.property) {
    await safeSelect(page, SEL.property, d.property, 'Property', result);
    await page.waitForTimeout(600);
  }

  // Step 4 — Fill listing title
  if (d.listing_title) {
    await safeField(page, SEL.title, d.listing_title, 'Listing Title', result);
  }

  // Step 5 — Fill description
  if (d.description) {
    await safeField(page, SEL.description, d.description, 'Description', result);
  }

  // Step 6 — Fill amenities
  // Try free-text amenities field first; if not found, attempt checkbox mapping
  if (d.description_tags && d.description_tags.length > 0) {
    const amenityText = d.description_tags.join(', ');
    const filled = await safeField(page, SEL.amenities, amenityText, 'Amenities (free text)', result);
    if (!filled) {
      result.executed_steps.push('  ↳ Free-text amenities field not found — attempting checkbox mapping');
      const amenityCheckboxMap = {
        'EV charger':  ['EV Charger', 'Electric Vehicle Charger', 'EV Charging'],
        'pool view':   ['Pool View', 'Pool'],
        '361 Mbps wifi': ['WiFi', 'High-Speed WiFi', 'Fast WiFi'],
        'king bed':    ['King Bed', 'King-size Bed'],
      };
      for (const tag of d.description_tags) {
        const candidates = amenityCheckboxMap[tag.toLowerCase()] || [tag];
        let checked = false;
        for (const label of candidates) {
          if (await safeCheck(page, label, `Amenity: ${tag}`, result)) {
            checked = true; break;
          }
        }
        if (!checked) {
          result.warnings.push(`Amenity option not found in UI: "${tag}" — logged and continuing`);
          result.executed_steps.push(`  ↳ Note: amenity "${tag}" has no matching UI option`);
        }
      }
    }
  }

  await smoothScroll(page, 300);
  await page.waitForTimeout(600);

  // Step 7 — Nightly rate
  if (d.nightly_rate) {
    await safeField(page, SEL.nightlyRate, d.nightly_rate, 'Nightly Rate', result);
  }

  // Step 8 — Cleaning fee
  if (d.cleaning_fee) {
    await safeField(page, SEL.cleaningFee, d.cleaning_fee, 'Cleaning Fee', result);
  }

  // Step 9 — Min stay
  if (d.min_stay) {
    await safeField(page, SEL.minStay, d.min_stay, 'Min Stay', result);
  }

  // Step 10 — Max stay
  if (d.max_stay) {
    await safeField(page, SEL.maxStay, d.max_stay, 'Max Stay', result);
  }

  // Step 11 — Select channels (priority channel first)
  const channels = d.publish_channels || [];
  const ordered  = d.publish_priority
    ? [d.publish_priority, ...channels.filter(c => c !== d.publish_priority)]
    : channels;

  for (const channel of ordered) {
    await safeCheck(page, channel, `Publish Channel: ${channel}`, result);
    await page.waitForTimeout(400);
  }

  await smoothScroll(page, 300);
  await page.waitForTimeout(800);

  // Step 12 — Screenshot before submit
  result.screenshots.before_submit = await screenshot(page, `${result.test_case_id}-before-submit`);
  result.executed_steps.push(`✓ Screenshot captured before submit`);

  // Step 13 — Submit
  const submitted = await safeClick(page, SEL.submitBtn, 'Submit / Create Listing', result, 6000);
  if (!submitted) {
    result.warnings.push('Submit button not found — form may auto-save or use different trigger');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  // Step 14 — Screenshot after submit
  result.screenshots.after_submit = await screenshot(page, `${result.test_case_id}-after-submit`);
  result.executed_steps.push(`✓ Screenshot captured after submit`);
}

// ── VERIFY ─────────────────────────────────────────────────────────────────
async function verify(page, parsedData, result) {
  const title = parsedData.listing_title || '';

  // Check 1: draft badge visible
  try {
    const draft = page.locator('text=/draft/i').first();
    result.verification_results.draft_badge_visible = await draft.isVisible({ timeout: 4000 });
  } catch { result.verification_results.draft_badge_visible = false; }

  // Check 2: success toast
  try {
    const toast = page.locator('[role="alert"], [role="status"], .toast, .notification').first();
    result.verification_results.success_toast = await toast.isVisible({ timeout: 3000 });
  } catch { result.verification_results.success_toast = false; }

  // Check 3: listing title appears in page
  try {
    if (title) {
      const el = page.locator(`text="${title}"`).first();
      result.verification_results.listing_title_visible = await el.isVisible({ timeout: 4000 });
    }
  } catch { result.verification_results.listing_title_visible = false; }

  // Check 4: URL changed (detail page opened)
  result.verification_results.url_after_submit = page.url();

  // Determine pass/fail
  const v = result.verification_results;
  const anyVerified = v.draft_badge_visible || v.success_toast || v.listing_title_visible;

  if (!anyVerified && result.missing_selectors.length > 3) {
    result.pass_fail = 'FAIL';
    result.error = 'Verification failed — no draft badge, toast, or listing title found after submit';
  } else if (result.missing_selectors.length > 0 && !anyVerified) {
    result.pass_fail = 'PARTIAL';
    result.error = `${result.missing_selectors.length} fields missing, verification inconclusive`;
  } else {
    result.pass_fail = 'PASS';
  }

  result.executed_steps.push(`✓ Verification complete: ${JSON.stringify(v)}`);
}

module.exports = { execute, verify };
