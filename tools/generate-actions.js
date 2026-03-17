/**
 * Parse a test case sheet (xlsx or csv) and return structured test cases.
 * Called by the skill to determine which test IDs are new and need automation code generated.
 *
 * Usage:
 *   node tools/generate-actions.js <sheetPath>
 *
 * Prints a JSON summary of: existing, missing, and all test case metadata.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const ACTIONS_PATH = path.join(__dirname, '..', 'tests', 'actions.js');

/**
 * Parse an xlsx or csv file into an array of test case objects.
 * Expects columns: ID, Title, Priority, Steps (or Step Description), Expected Result
 */
function parseSheet(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  return rows.map(row => {
    // Normalize common column name variations
    const id = row['ID'] || row['Test ID'] || row['TestID'] || '';
    const title = row['Title'] || row['Test Case'] || row['Name'] || row['Summary'] || '';
    const priority = row['Priority'] || row['P'] || '';
    const steps = row['Steps'] || row['Step Description'] || row['Test Steps'] || row['Description'] || '';
    const expected = row['Expected Result'] || row['Expected'] || row['Expected Outcome'] || '';
    const tab = row['Tab'] || row['Module'] || row['Section'] || '';

    return { id: id.trim(), title: title.trim(), priority: priority.trim(), steps, expected, tab };
  }).filter(tc => tc.id && tc.title);
}

/**
 * Return a set of test IDs already implemented in tests/actions.js
 */
function getExistingActionIds() {
  if (!fs.existsSync(ACTIONS_PATH)) return new Set();
  const src = fs.readFileSync(ACTIONS_PATH, 'utf8');
  const matches = src.matchAll(/['"]?(TC-[A-Z0-9-]+)['"]?\s*:/g);
  return new Set([...matches].map(m => m[1]));
}

/**
 * Main: parse sheet, diff against existing actions, print summary as JSON.
 */
function analyzeSheet(sheetPath) {
  const testCases = parseSheet(sheetPath);
  const existingIds = getExistingActionIds();

  const existing = testCases.filter(tc => existingIds.has(tc.id));
  const missing = testCases.filter(tc => !existingIds.has(tc.id));

  const summary = {
    total: testCases.length,
    existingCount: existing.length,
    missingCount: missing.length,
    existing: existing.map(tc => tc.id),
    missing: missing.map(tc => ({ id: tc.id, title: tc.title, priority: tc.priority, steps: tc.steps, expected: tc.expected, tab: tc.tab })),
    all: testCases,
  };

  return summary;
}

// CLI usage
if (require.main === module) {
  const sheetPath = process.argv[2];
  if (!sheetPath) {
    console.error('Usage: node tools/generate-actions.js <sheetPath>');
    process.exit(1);
  }
  const summary = analyzeSheet(sheetPath);
  console.log(JSON.stringify(summary, null, 2));
}

module.exports = { parseSheet, getExistingActionIds, analyzeSheet };
