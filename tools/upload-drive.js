const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDS_PATH = path.join(__dirname, '..', '.google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', '.google-token.json');
const PARENT_FOLDER_ID = '1CwM9T1JrMR91stop4LBL4cnFCtVttIwE';

function getAuth() {
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
  return oAuth2Client;
}

async function createFolder(drive, name, parentId) {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, webViewLink',
  });
  return res.data;
}

async function uploadFile(drive, filePath, parentId) {
  const name = path.basename(filePath);
  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
    },
    media: {
      mimeType: 'video/webm',
      body: fs.createReadStream(filePath),
    },
    fields: 'id, name, webViewLink',
  });
  return res.data;
}

/**
 * Upload all videos from a local directory into a new timestamped folder on Drive.
 * @param {string} videosDir  - local folder containing .webm files
 * @param {string} runLabel   - label for the run folder (e.g. "STR-Run-2026-03-17-143022")
 * @returns {{ folderLink: string, files: Array }}
 */
async function uploadRun(videosDir, runLabel) {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Create run folder inside parent
  console.log(`\n▶ Creating Drive folder: ${runLabel}`);
  const folder = await createFolder(drive, runLabel, PARENT_FOLDER_ID);
  console.log(`  Folder: ${folder.webViewLink}`);

  // Upload each .webm file
  const files = fs.readdirSync(videosDir).filter(f => f.endsWith('.webm'));
  const uploaded = [];

  for (const file of files) {
    const filePath = path.join(videosDir, file);
    console.log(`  Uploading: ${file}`);
    const result = await uploadFile(drive, filePath, folder.id);
    uploaded.push({ name: result.name, link: result.webViewLink });
    console.log(`  ✓ ${file}`);
  }

  return { folderLink: folder.webViewLink, files: uploaded };
}

module.exports = { uploadRun };
