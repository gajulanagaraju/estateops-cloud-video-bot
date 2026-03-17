/**
 * Download an xlsx or csv test case sheet from Google Drive.
 * Supports:
 *   - Google Sheets (exports as xlsx)
 *   - Uploaded .xlsx / .csv files stored in Drive
 *
 * Usage:
 *   node tools/download-sheet.js <fileId|url> [outputPath]
 *
 * Output defaults to: /tmp/estateops-test-cases.xlsx (or .csv)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { CREDS_PATH, TOKEN_PATH } = require('./google-paths');

function getAuth() {
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
  return oAuth2Client;
}

/**
 * Extract file ID from a Google Drive URL or return as-is if already an ID.
 */
function extractFileId(input) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  return input; // assume raw file ID
}

/**
 * Download a file from Google Drive.
 * @param {string} fileIdOrUrl  - Drive file ID or share URL
 * @param {string} [outputPath] - where to save; auto-detected if omitted
 * @returns {string} absolute path of the saved file
 */
async function downloadSheet(fileIdOrUrl, outputPath) {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const fileId = extractFileId(fileIdOrUrl);

  // Get file metadata to determine type
  const meta = await drive.files.get({
    fileId,
    fields: 'name, mimeType',
  });

  const { name, mimeType } = meta.data;
  console.log(`\n▶ Found: "${name}" (${mimeType})`);

  const isGoogleSheet = mimeType === 'application/vnd.google-apps.spreadsheet';
  const isCsv = name.endsWith('.csv') || mimeType === 'text/csv';

  let destPath = outputPath;
  if (!destPath) {
    const ext = isGoogleSheet ? '.xlsx' : isCsv ? '.csv' : path.extname(name) || '.xlsx';
    destPath = path.join('/tmp', `estateops-test-cases${ext}`);
  }

  const writer = fs.createWriteStream(destPath);

  if (isGoogleSheet) {
    // Export Google Sheet as xlsx
    const res = await drive.files.export(
      { fileId, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { responseType: 'stream' }
    );
    await new Promise((resolve, reject) => {
      res.data.pipe(writer);
      res.data.on('error', reject);
      writer.on('finish', resolve);
    });
  } else {
    // Download binary file (xlsx, csv, etc.)
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    await new Promise((resolve, reject) => {
      res.data.pipe(writer);
      res.data.on('error', reject);
      writer.on('finish', resolve);
    });
  }

  console.log(`✓ Saved to: ${destPath}\n`);
  return destPath;
}

// Allow direct CLI use
if (require.main === module) {
  const [,, input, output] = process.argv;
  if (!input) {
    console.error('Usage: node tools/download-sheet.js <fileId|url> [outputPath]');
    process.exit(1);
  }
  downloadSheet(input, output).catch(err => {
    console.error('✗', err.message);
    process.exit(1);
  });
}

module.exports = { downloadSheet, extractFileId };
