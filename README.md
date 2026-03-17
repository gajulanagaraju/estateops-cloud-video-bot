# EstateOps Cloud — Video Recording Bot

Automated Playwright script that records a full walkthrough of the EstateOps STR module and saves it as a video file. Used to generate onboarding and demo videos without manual screen recording.

---

## What It Records

Logs in to [estateops.cloud](https://estateops.cloud), navigates to **Short Term Rentals**, then clicks through all 11 tabs in order:

Dashboard → Properties → Listings → Bookings → Calendar → Cleaning → Supplies → Guest Messages → Maintenance → Reports → Settings

Each tab is recorded with smooth scrolling and natural mouse movement.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- [ffmpeg](https://ffmpeg.org/download.html) (for MP4 conversion)
- A valid EstateOps account

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/gajulanagaraju/estateops-cloud-video-bot.git
cd estateops-cloud-video-bot
```

### 2. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 3. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```
ESTATEOPS_EMAIL=your@email.com
ESTATEOPS_PASSWORD=yourpassword
```

> `.env` is gitignored and will never be committed.

---

## Run

### Record the video

```bash
node record-str.js
```

A browser window will open and the script will run automatically. When done, a `.webm` file will appear in the `videos/` folder.

### Convert to MP4

```bash
ffmpeg -i videos/*.webm -vcodec libx264 -acodec aac videos/output.mp4
```

### One command (record + convert)

```bash
bash run.sh
```

---

## Output

| File | Description |
|------|-------------|
| `videos/*.webm` | Raw recording from Playwright |
| `videos/output.mp4` | Final converted video |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Browser opens but nothing happens | Check `.env` credentials are correct |
| Onboarding modal blocks flow | Script auto-dismisses — if it fails, note the button text and open an issue |
| Tab not found / timeout | The tab label may have changed in the app — update the `tabs` array in `record-str.js` |
| `ffmpeg` not found | Install via `winget install ffmpeg` (Windows) or `brew install ffmpeg` (Mac) |
| `playwright` not found | Run `npx playwright install chromium` |

---

## File Structure

```
estateops-cloud-video-bot/
├── record-str.js       # Main recording script
├── run.sh              # One-command record + convert
├── scripts/
│   └── flow.md         # Recording flow notes for Claude
├── videos/             # Output folder (gitignored)
├── .env                # Your credentials (gitignored)
├── .env.example        # Template — copy this to .env
└── package.json
```

---

## Notes for Testers

- Do **not** interact with the browser while the script is running
- The browser runs in visible mode (`headless: false`) so you can watch it record
- `slowMo: 300` is intentional — it makes the video readable for viewers
- If the platform UI changes, update the tab names in the `tabs` array in `record-str.js`
- Videos are saved locally and are **not** pushed to GitHub
