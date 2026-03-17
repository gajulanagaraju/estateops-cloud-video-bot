/**
 * Run this ONCE to authenticate with Google Drive + Gmail.
 * Token is saved to ~/.estateops-google-token.json and reused by all scripts
 * on this computer — no need to re-authenticate per project.
 *
 * Prerequisites:
 *   1. Go to https://console.cloud.google.com
 *   2. Create a project → Enable "Google Drive API" and "Gmail API"
 *   3. APIs & Services → Credentials → Create OAuth 2.0 Client ID (Desktop App)
 *   4. Download JSON → save to ~/Downloads (keep the original filename)
 *   5. Run: node tools/google-auth.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

const { CREDS_PATH, TOKEN_PATH } = require('./google-paths');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
];

if (!fs.existsSync(CREDS_PATH)) {
  console.error(`\n✗ Google credentials file not found at:\n  ${CREDS_PATH}\n`);
  console.error(`Steps:`);
  console.error(`  1. Go to https://console.cloud.google.com`);
  console.error(`  2. Create project → Enable Drive API + Gmail API`);
  console.error(`  3. Credentials → Create OAuth 2.0 Client ID (Desktop App)`);
  console.error(`  4. Download JSON → save to ~/Downloads (keep original filename)\n`);
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
    console.log(`\n✓ Token saved to: ${TOKEN_PATH}`);
    console.log(`  All scripts on this computer will reuse this token.\n`);
  } catch (err) {
    console.error('✗ Error getting token:', err.message);
  }
});
