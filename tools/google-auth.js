/**
 * Run this ONCE to authenticate with Google Drive + Gmail.
 * Creates .google-token.json which is reused for all future runs.
 *
 * Prerequisites:
 *   1. Go to https://console.cloud.google.com
 *   2. Create a project → Enable "Google Drive API" and "Gmail API"
 *   3. APIs & Services → Credentials → Create OAuth 2.0 Client ID (Desktop App)
 *   4. Download JSON → save as .google-credentials.json in this folder
 *   5. Run: node tools/google-auth.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CREDS_PATH = path.join(__dirname, '..', '.google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', '.google-token.json');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
];

if (!fs.existsSync(CREDS_PATH)) {
  console.error(`\n✗ Missing .google-credentials.json\n`);
  console.error(`Steps:`);
  console.error(`  1. Go to https://console.cloud.google.com`);
  console.error(`  2. Create project → Enable Drive API + Gmail API`);
  console.error(`  3. Credentials → Create OAuth 2.0 Client ID (Desktop App)`);
  console.error(`  4. Download JSON → save as .google-credentials.json here\n`);
  process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(CREDS_PATH));
const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
console.log('\n▶ Open this URL in your browser:\n');
console.log(authUrl);
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the authorization code here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log(`\n✓ Token saved to .google-token.json`);
    console.log(`  You're now authenticated for Drive + Gmail.\n`);
  } catch (err) {
    console.error('✗ Error getting token:', err.message);
  }
});
