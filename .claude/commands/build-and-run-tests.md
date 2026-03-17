# Skill: build-and-run-tests

Build and run Playwright automation from a test case sheet stored in Google Drive (xlsx or csv).

## Arguments

`$ARGUMENTS` — one of:
- A Google Drive file URL (share link or open link)
- A Google Drive file ID (the long alphanumeric string)
- A local file path to an xlsx or csv file
- Empty — uses the default path already set in `run-all-tests.js`

Optional filter flags (append after the file arg):
- `--priority P0` — run only P0 tests
- `TC-STR-003 TC-STR-010` — run specific test IDs

## Steps to follow

### Step 1 — Resolve the sheet

If `$ARGUMENTS` starts with `http`, contains `/d/`, or looks like a Drive file ID (32+ alphanum chars), download it:

```bash
node tools/download-sheet.js "$ARGUMENTS"
```

This saves the file to `/tmp/estateops-test-cases.xlsx` (or `.csv`).

If `$ARGUMENTS` is a local file path, use it directly.

If no argument is given, check `run-all-tests.js` for the hardcoded `EXCEL_PATH` and use that.

### Step 2 — Analyse the sheet

Run the analyser to identify which test cases in the sheet already have automation and which are new:

```bash
node tools/generate-actions.js /tmp/estateops-test-cases.xlsx
```

Read the JSON output. Pay attention to the `missing` array — these are test cases that need new Playwright action functions written.

### Step 3 — Generate missing actions

For each entry in `missing`:

1. Read `tests/actions.js` to understand the existing code style.
2. Read `tests/helpers.js` to know the available helper functions: `clickTab`, `smoothScroll`, `tryClick`, `tryFill`.
3. For each missing test case, write a new `async function TC_XXX_NNN(page)` using:
   - The `steps` field to determine what UI interactions to perform
   - The `tab` field (if present) to know which tab to navigate to first via `clickTab(page, 'TabName')`
   - The `expected` field as a comment at the top of the function documenting what a pass looks like
   - `tryClick` / `tryFill` for all interactions (never hard `click()` without error handling)
   - `smoothScroll` after navigating to each section
   - `await page.waitForTimeout(1500–2500)` between major actions for video readability
4. Append all new functions to `tests/actions.js` before the `module.exports` block.
5. Add each new ID to the `module.exports` object at the bottom of `tests/actions.js`.

**Code style rules:**
- Follow the exact same pattern as existing test cases in `tests/actions.js`
- Use `||` chaining with `tryClick` for selector fallbacks (text= first, then data-testid, then role)
- Never use `page.click()` directly — always `tryClick` or `tab.click()` after `waitFor`
- Keep each function self-contained — it receives `page` already on the STR section
- Add a comment header matching the pattern: `// ── TC-XXX-NNN ── Test Case Title`

### Step 4 — Update run-all-tests.js if needed

If the sheet path is different from the hardcoded `EXCEL_PATH` in `run-all-tests.js`, update it to point to the downloaded/local file so the runner can load test case metadata (Title, Priority) for the report.

### Step 5 — Run the tests

Determine the run command based on optional filter flags in `$ARGUMENTS`:

- No filter: `node run-all-tests.js`
- Priority filter: `node run-all-tests.js --priority P0`
- Specific IDs: `node run-all-tests.js TC-STR-003 TC-STR-010`

Run it:

```bash
node run-all-tests.js
```

Watch the output. Each test case will print `✓ PASS` or `✗ FAIL` with the error message.

### Step 6 — Report back

After the run completes, summarise:
- Total / Passed / Failed counts
- List any failed test cases with their error messages
- Confirm whether the Google Drive upload and email report succeeded
- Remind the user where videos were saved (`videos/tests/`)

## Error handling

- If `node tools/download-sheet.js` fails with an auth error, tell the user to run `node tools/google-auth.js` first
- If a test case in the sheet has no `ID` or `Title` column, warn the user and skip those rows
- If `run-all-tests.js` exits with a non-zero code, show the last 30 lines of output
- If Drive upload fails mid-run, note it but do not block the report — local videos are still valid
