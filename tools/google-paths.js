/**
 * Machine-wide Google OAuth paths.
 * Credentials live in ~/Downloads (where Google Cloud Console downloads them).
 * Token is stored in ~/.estateops-google-token.json — shared across all scripts
 * on this computer so authentication only needs to happen once.
 */

const os = require('os');
const path = require('path');

const CREDS_PATH = path.join(
  os.homedir(),
  'Downloads',
  'client_secret_2_575541148863-nno8ur6ef13aauecfd3jam2r68eh70mj.apps.googleusercontent.com.json'
);

const TOKEN_PATH = path.join(os.homedir(), '.estateops-google-token.json');

module.exports = { CREDS_PATH, TOKEN_PATH };
