require('dotenv').config();
const { chromium } = require('playwright');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const { login, dismissOnboarding, navigateToSTR } = require('./tests/helpers');
const actions = require('./tests/actions');
const { uploadRun } = require('./tools/upload-drive');
const { sendReport } = require('./tools/send-report');

const VIDEOS_DIR = path.join(__dirname, 'videos', 'tests');
const REPORT_EMAIL = 'raju1410@gmail.com';
const EXCEL_PATH = 'R:/PreSell360App/Testing/STR-estateops-test-cases-filled.xlsx';

// Slug for safe filenames
function slug(str) {
  return str.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').slice(0, 60);
}

async function runTestCase(testCase) {
  const { ID, Title } = testCase;
  const actionFn = actions[ID];

  console.log(`\n▶ [${ID}] ${Title}`);

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  const videoFile = page.video();

  let status = 'PASS';
  let error = '';

  try {
    await login(page);
    await dismissOnboarding(page);
    await navigateToSTR(page);

    if (actionFn) {
      await actionFn(page);
    } else {
      console.log(`  ⚠ No action defined for ${ID} — recording navigation only`);
    }

    await page.waitForTimeout(2000); // hold on final state
  } catch (err) {
    status = 'FAIL';
    error = err.message.split('\n')[0];
    console.error(`  ✗ ${error}`);
    try { await page.screenshot({ path: path.join(VIDEOS_DIR, `${ID}-error.png`) }); } catch {}
  }

  await context.close();
  await browser.close();

  // Rename video to test ID + title
  try {
    const rawPath = await videoFile.path();
    const destName = `${ID}-${slug(Title)}.webm`;
    const destPath = path.join(VIDEOS_DIR, destName);
    fs.renameSync(rawPath, destPath);
    console.log(`  ${status === 'PASS' ? '✓' : '✗'} ${status} → ${destName}`);
  } catch (e) {
    console.error(`  ⚠ Could not rename video: ${e.message}`);
  }

  return { ID, Title, status, error };
}

(async () => {
  const startTime = Date.now();

  // Load test cases from Excel
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const testCases = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`\nEstateOps STR — Test Recording Runner`);
  console.log(`Found ${testCases.length} test cases\n`);

  // Optional: filter by ID or priority via CLI args
  // e.g. node run-all-tests.js TC-STR-003 TC-STR-010
  // e.g. node run-all-tests.js --priority P0
  const args = process.argv.slice(2);
  let filtered = testCases;

  if (args.includes('--priority')) {
    const p = args[args.indexOf('--priority') + 1];
    filtered = testCases.filter(tc => tc.Priority === p);
    console.log(`Filtering to priority ${p}: ${filtered.length} cases`);
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    filtered = testCases.filter(tc => args.includes(tc.ID));
    console.log(`Running specific tests: ${filtered.map(t => t.ID).join(', ')}`);
  }

  const results = [];
  for (const tc of filtered) {
    const result = await runTestCase(tc);
    results.push(result);
  }

  const durationMs = Date.now() - startTime;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log('\n══════════════════════════════════');
  console.log(`  Results: ${passed} PASSED  ${failed} FAILED`);
  console.log('══════════════════════════════════');

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ✗ [${r.ID}] ${r.Title}`);
      console.log(`    ${r.error}`);
    });
  }

  // ── UPLOAD TO GOOGLE DRIVE ─────────────────────────────────────────────────
  const now = new Date();
  const runLabel = `STR-Run-${now.toISOString().replace(/[:T]/g, '-').slice(0, 19)}`;

  let folderLink = '';
  try {
    const { folderLink: link, files } = await uploadRun(VIDEOS_DIR, runLabel);
    folderLink = link;

    // Attach Drive video links to results
    files.forEach(f => {
      const id = f.name.split('-').slice(0, 2).join('-'); // e.g. "TC-STR-001"
      const match = results.find(r => r.ID === id);
      if (match) match.videoLink = f.link;
    });
  } catch (err) {
    console.error(`\n⚠ Drive upload failed: ${err.message}`);
    console.error(`  Run: node tools/google-auth.js  to re-authenticate.`);
  }

  // ── SEND EMAIL REPORT ──────────────────────────────────────────────────────
  try {
    await sendReport({
      to: REPORT_EMAIL,
      runLabel,
      results,
      folderLink,
      durationMs,
    });
  } catch (err) {
    console.error(`\n⚠ Email failed: ${err.message}`);
  }

  console.log(`\nVideos saved to: ${VIDEOS_DIR}`);
})();
