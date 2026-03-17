# EstateOps Cloud — Video Recording & Test Automation Bot

Playwright-based bot that records the EstateOps STR module — both as a full walkthrough video and as individual per-test-case recordings. After each test run, videos are uploaded to Google Drive and a report is emailed automatically.

---

## What It Does

| Mode | Command | Output |
|------|---------|--------|
| Full walkthrough | `node record-str.js` | Single video of all 11 STR tabs |
| All 26 test cases | `node run-all-tests.js` | 26 separate videos + Drive upload + email report |
| P0 tests only | `node run-all-tests.js --priority P0` | Priority-filtered subset |
| Specific tests | `node run-all-tests.js TC-STR-003 TC-STR-010` | Named test cases only |
| Record + convert | `bash run.sh` | `.webm` → `.mp4` via ffmpeg |

---

## STR Tabs Covered

Dashboard → Properties → Listings → Bookings → Calendar → Cleaning → Supplies → Guest Messages → Maintenance → Reports → Settings

---

## Requirements

- [Node.js](https://nodejs.org/) v18+
- [ffmpeg](https://ffmpeg.org/) — `winget install ffmpeg` (Windows)
- EstateOps account
- Google Cloud project with Drive API + Gmail API enabled (for upload + email)

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/gajulanagaraju/estateops-cloud-video-bot.git
cd estateops-cloud-video-bot
npm install
npx playwright install chromium
```

### 2. Create `.env`

```bash
cp .env.example .env
```

```
ESTATEOPS_EMAIL=your@email.com
ESTATEOPS_PASSWORD=yourpassword
```

### 3. Google Auth (one-time per machine)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable **Google Drive API** + **Gmail API**
3. Credentials → Create **OAuth 2.0 Client ID** (Desktop App) → Download JSON
4. Save as `.google-credentials.json` in the project root
5. Run:

```bash
node tools/google-auth.js
```

Opens a browser → sign in → paste the code from the redirect URL → saves `.google-token.json`

---

## Run

### Full walkthrough video

```bash
node record-str.js
```

### All 26 test cases (with Drive upload + email report)

```bash
node run-all-tests.js
```

After completion:
- Videos saved to `videos/tests/` as `TC-STR-XXX-Title.webm`
- New folder created in Google Drive: `STR-Run-YYYY-MM-DD-HHMMSS/`
- HTML report emailed to `raju1410@gmail.com` with pass/fail summary and video links

---

## File Structure

```
estateops-cloud-video-bot/
├── record-str.js           # Full walkthrough recording
├── run-all-tests.js        # Test runner — reads Excel, records, uploads, emails
├── run.sh                  # One-command: record + convert to MP4
├── tests/
│   ├── helpers.js          # Shared: login, dismissOnboarding, navigateToSTR, clickTab
│   └── actions.js          # 26 action functions, one per test case
├── tools/
│   ├── google-auth.js      # One-time OAuth2 setup
│   ├── upload-drive.js     # Creates run folder + uploads videos to Drive
│   └── send-report.js      # Sends HTML report via Gmail API
├── scripts/
│   └── flow.md             # Recording flow reference
├── videos/
│   └── tests/              # Per-test .webm recordings (gitignored)
├── .env                    # Credentials (gitignored)
├── .env.example            # Template
├── .google-credentials.json  # Google OAuth client (gitignored)
└── .google-token.json        # Google OAuth token (gitignored)
```

---

## Test Cases

Sourced from `STR-estateops-test-cases-filled.xlsx` — 26 test cases across all STR tabs:

| Range | Coverage |
|-------|----------|
| TC-STR-001–002 | Onboarding & property setup |
| TC-STR-003–005 | Dashboard KPIs, listings |
| TC-STR-006–009 | Bookings: create, cancel, check-in, check-out |
| TC-STR-010–012 | Calendar: iCal sync, multi-channel, double booking |
| TC-STR-013–015 | Cleaning: auto-generate, manual, checklist |
| TC-STR-016–017 | Supplies: add item, low stock alerts |
| TC-STR-018–019 | Guest messages |
| TC-STR-020 | Maintenance reporting |
| TC-STR-021–023 | Reports: revenue, CSV export, channel mix |
| TC-STR-024–025 | Settings: defaults, calendar sync |
| TC-STR-026 | Operator data isolation |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Browser opens but login fails | Check `.env` credentials |
| Onboarding modal blocks flow | Script auto-dismisses — note exact button text if it fails |
| Tab not found / timeout | Tab label changed in app — update `tests/actions.js` |
| Drive upload fails | Re-run `node tools/google-auth.js` |
| `ffmpeg` not found | `winget install ffmpeg` |
| `playwright` not found | `npx playwright install chromium` |

---

## Notes for Testers

- Do not interact with the browser while the script is running
- Browser runs visible (`headless: false`) so you can watch it
- `slowMo: 200` is intentional — makes videos readable
- Videos are gitignored and never pushed
