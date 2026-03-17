const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDS_PATH = path.join(__dirname, '..', '.google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', '.google-token.json');

function getAuth() {
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
  return oAuth2Client;
}

function buildHtmlReport({ runLabel, results, folderLink, durationMs }) {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const duration = (durationMs / 1000 / 60).toFixed(1);

  const rows = results.map(r => {
    const color = r.status === 'PASS' ? '#16a34a' : '#dc2626';
    const bg = r.status === 'PASS' ? '#f0fdf4' : '#fef2f2';
    const icon = r.status === 'PASS' ? '✅' : '❌';
    const videoCell = r.videoLink
      ? `<a href="${r.videoLink}" style="color:#2563eb;">▶ Watch</a>`
      : '—';
    const errorCell = r.error
      ? `<span style="color:#dc2626;font-size:12px;">${r.error}</span>`
      : '';
    return `
      <tr style="background:${bg};">
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;">${r.ID}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${r.Title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${r.Priority || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:700;color:${color};">${icon} ${r.status}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${videoCell}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${errorCell}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:900px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:32px;">
      <h1 style="color:#fff;margin:0 0 4px;font-size:22px;">EstateOps STR — Test Run Report</h1>
      <p style="color:#bfdbfe;margin:0;font-size:14px;">${runLabel}</p>
    </div>

    <!-- Stats -->
    <div style="display:flex;gap:0;border-bottom:1px solid #e5e7eb;">
      <div style="flex:1;padding:20px 24px;text-align:center;border-right:1px solid #e5e7eb;">
        <div style="font-size:32px;font-weight:700;color:#374151;">${total}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Total Tests</div>
      </div>
      <div style="flex:1;padding:20px 24px;text-align:center;border-right:1px solid #e5e7eb;">
        <div style="font-size:32px;font-weight:700;color:#16a34a;">${passed}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Passed</div>
      </div>
      <div style="flex:1;padding:20px 24px;text-align:center;border-right:1px solid #e5e7eb;">
        <div style="font-size:32px;font-weight:700;color:#dc2626;">${failed}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Failed</div>
      </div>
      <div style="flex:1;padding:20px 24px;text-align:center;">
        <div style="font-size:32px;font-weight:700;color:#374151;">${duration}m</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Duration</div>
      </div>
    </div>

    <!-- Drive Link -->
    <div style="padding:16px 24px;background:#eff6ff;border-bottom:1px solid #bfdbfe;">
      <a href="${folderLink}" style="color:#2563eb;font-weight:600;font-size:14px;">📁 Open Run Folder in Google Drive →</a>
    </div>

    <!-- Results Table -->
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">ID</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Test Case</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Priority</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Status</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Video</th>
            <th style="padding:10px 12px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Error</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
      Generated by EstateOps Video Bot · ${new Date().toUTCString()}
    </div>
  </div>
</body>
</html>`;
}

function makeRawEmail({ to, subject, htmlBody }) {
  const boundary = 'boundary_estateops_' + Date.now();
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody,
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send the test report email via Gmail API.
 */
async function sendReport({ to, runLabel, results, folderLink, durationMs }) {
  const auth = getAuth();
  const gmail = google.gmail({ version: 'v1', auth });

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const statusTag = failed > 0 ? `⚠ ${failed} FAILED` : '✅ All Passed';

  const subject = `[EstateOps STR] Test Report — ${statusTag} | ${runLabel}`;
  const htmlBody = buildHtmlReport({ runLabel, results, folderLink, durationMs });

  const raw = makeRawEmail({ to, subject, htmlBody });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  console.log(`\n✓ Report emailed to ${to}`);
}

module.exports = { sendReport };
