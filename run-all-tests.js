/**
 * run-all-tests.js
 *
 * Orchestrates the full STR test suite:
 *  1. Login once → save auth state (no repeated logins)
 *  2. For each test case from Excel:
 *     a. Parse row + Test Data into structured object
 *     b. Open new recorded browser context (loaded with auth state)
 *     c. Dispatch to TC-specific handler OR fall back to nav-only action
 *     d. Verify expected result
 *     e. Save result JSON + rename video
 *  3. Upload all videos to Google Drive (timestamped run folder)
 *  4. Email HTML report to raju1410@gmail.com
 *
 * For form-based STR tests, Test Data column drives UI input values.
 * Steps only define sequence.
 *
 * Usage:
 *   node run-all-tests.js                      — all 26 tests
 *   node run-all-tests.js --priority P0         — P0 only
 *   node run-all-tests.js TC-STR-004 TC-STR-006 — specific tests
 */

require('dotenv').config();
const { chromium } = require('playwright');
const XLSX  = require('xlsx');
const fs    = require('fs');
const path  = require('path');

const { loginAndSaveState, authState, dismissOnboarding, navigateToSTR } = require('./tests/helpers');
const { parseExcelRow }   = require('./tests/parser');
const { makeResult, saveResult } = require('./tests/executor');
const navActions          = require('./tests/actions');   // fallback nav-only actions
const { uploadRun }       = require('./tools/upload-drive');
const { sendReport }      = require('./tools/send-report');

const VIDEOS_DIR  = path.join(__dirname, 'videos', 'tests');
const EXCEL_PATH  = 'R:/PreSell360App/Testing/STR-estateops-test-cases-filled.xlsx';
const REPORT_EMAIL = 'raju1410@gmail.com';

// ── TC-SPECIFIC HANDLERS ──────────────────────────────────────────────────
// Add new entries here as TC handlers are implemented.
// Each module exports { execute(page, parsedData, result), verify(page, parsedData, result) }
const TC_HANDLERS = {
  'TC-STR-004': require('./tests/tc/TC-STR-004'),
};

// ── SLUG ──────────────────────────────────────────────────────────────────
function slug(str) {
  return str.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').slice(0, 60);
}

// ── RUN ONE TEST CASE ─────────────────────────────────────────────────────
async function runTestCase(row, browser) {
  const result = makeResult(row);
  const videoRef = { ref: null };

  console.log(`\n▶ [${row.id}] ${row.title}`);
  if (Object.keys(row.testData).length > 0) {
    console.log(`  Data: ${JSON.stringify(row.testData)}`);
  }

  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
    ...authState(),
  });
  const page = await context.newPage();
  videoRef.ref = page.video();

  try {
    // If auth state is loaded the user is already logged in — just navigate
    await page.goto('https://estateops.cloud', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await dismissOnboarding(page);
    await navigateToSTR(page);

    const handler = TC_HANDLERS[row.id];

    if (handler) {
      // ── Full data-driven execution ──────────────────────────────────────
      result.executed_steps.push(`Using TC handler: ${row.id}`);
      await handler.execute(page, row.testData, result);
      await handler.verify(page, row.testData, result);
    } else {
      // ── Nav-only fallback (existing actions.js) ─────────────────────────
      const navFn = navActions[row.id];
      if (navFn) {
        result.executed_steps.push('Using navigation-only fallback action');
        await navFn(page);
        result.pass_fail = 'PASS';
      } else {
        result.executed_steps.push('No handler and no nav action — recording navigation only');
        result.warnings.push('No TC handler defined — add to TC_HANDLERS in run-all-tests.js');
      }
    }

    await page.waitForTimeout(2000);
  } catch (err) {
    result.pass_fail = 'FAIL';
    result.error = err.message.split('\n')[0];
    console.error(`  ✗ ${result.error}`);
    try {
      const ss = path.join(VIDEOS_DIR, 'screenshots', `${row.id}-crash.png`);
      await page.screenshot({ path: ss });
      result.screenshots.crash = ss;
    } catch {}
  }

  await context.close();

  // Rename video
  try {
    const rawPath = await videoRef.ref.path();
    const destName = `${row.id}-${slug(row.title)}.webm`;
    const destPath = path.join(VIDEOS_DIR, destName);
    if (fs.existsSync(rawPath)) fs.renameSync(rawPath, destPath);
    result.video_path = destPath;
  } catch (e) {
    result.warnings.push(`Video rename failed: ${e.message}`);
  }

  // Save result JSON
  const resultFile = saveResult(result);

  const icon = result.pass_fail === 'PASS' ? '✓' : result.pass_fail === 'PARTIAL' ? '~' : '✗';
  console.log(`  ${icon} ${result.pass_fail} → ${path.basename(result.video_path || '')}`);
  if (result.missing_selectors.length > 0) {
    console.log(`  ⚠ Missing selectors: ${result.missing_selectors.join(', ')}`);
  }

  return result;
}

// ── MAIN ──────────────────────────────────────────────────────────────────
(async () => {
  const startTime = Date.now();

  // Load Excel
  const wb    = XLSX.readFile(EXCEL_PATH);
  const ws    = wb.Sheets[wb.SheetNames[0]];
  const rows  = XLSX.utils.sheet_to_json(ws, { defval: '' }).map(parseExcelRow);

  console.log(`\nEstateOps STR — Test Recording Runner`);
  console.log(`Found ${rows.length} test cases`);

  // Filter by CLI args
  const args = process.argv.slice(2);
  let filtered = rows;
  if (args.includes('--priority')) {
    const p = args[args.indexOf('--priority') + 1];
    filtered = rows.filter(r => r.priority === p);
    console.log(`Priority filter: ${p} → ${filtered.length} cases`);
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    filtered = rows.filter(r => args.includes(r.id));
    console.log(`Running: ${filtered.map(r => r.id).join(', ')}`);
  }

  // Launch browser once — shared across all tests
  const browser = await chromium.launch({ headless: false, slowMo: 200 });

  // Login once + save auth state
  console.log('\n▶ Logging in (once for all tests)...');
  await loginAndSaveState(browser);

  // Run tests sequentially
  const results = [];
  for (const row of filtered) {
    const result = await runTestCase(row, browser);
    results.push(result);
  }

  await browser.close();

  const durationMs = Date.now() - startTime;
  const passed  = results.filter(r => r.pass_fail === 'PASS').length;
  const partial = results.filter(r => r.pass_fail === 'PARTIAL').length;
  const failed  = results.filter(r => r.pass_fail === 'FAIL').length;

  console.log('\n══════════════════════════════════════');
  console.log(`  PASSED: ${passed}  PARTIAL: ${partial}  FAILED: ${failed}`);
  console.log('══════════════════════════════════════');

  if (failed > 0 || partial > 0) {
    results.filter(r => r.pass_fail !== 'PASS').forEach(r => {
      console.log(`  ${r.pass_fail === 'PARTIAL' ? '~' : '✗'} [${r.test_case_id}] ${r.test_name}`);
      if (r.error) console.log(`    ${r.error}`);
      if (r.missing_selectors.length) console.log(`    Missing: ${r.missing_selectors.join(', ')}`);
    });
  }

  // ── UPLOAD TO GOOGLE DRIVE ───────────────────────────────────────────────
  const now = new Date();
  const runLabel = `STR-Run-${now.toISOString().replace(/[:T]/g, '-').slice(0, 19)}`;
  let folderLink = '';

  try {
    const { folderLink: link, files } = await uploadRun(VIDEOS_DIR, runLabel);
    folderLink = link;
    files.forEach(f => {
      const id = f.name.split('-').slice(0, 2).join('-');
      const match = results.find(r => r.test_case_id === id);
      if (match) match.videoLink = f.link;
    });
  } catch (err) {
    console.error(`\n⚠ Drive upload failed: ${err.message}`);
  }

  // ── EMAIL REPORT ─────────────────────────────────────────────────────────
  // Map result shape to what sendReport expects
  const reportResults = results.map(r => ({
    ID:       r.test_case_id,
    Title:    r.test_name,
    Priority: r.priority,
    status:   r.pass_fail === 'PASS' ? 'PASS' : 'FAIL',
    error:    r.error || (r.warnings.length ? r.warnings[0] : ''),
    videoLink: r.videoLink || '',
  }));

  try {
    await sendReport({ to: REPORT_EMAIL, runLabel, results: reportResults, folderLink, durationMs });
  } catch (err) {
    console.error(`\n⚠ Email failed: ${err.message}`);
  }

  console.log(`\nVideos  : ${VIDEOS_DIR}`);
  console.log(`Results : ${path.join(VIDEOS_DIR, 'results')}`);
})();
