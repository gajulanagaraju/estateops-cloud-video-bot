/**
 * parser.js
 *
 * Parses Excel rows into structured test case objects.
 * Test Data column is the source of truth for ALL form values.
 * Steps only define sequence — Test Data drives UI input.
 *
 * For form-based STR tests, Test Data column drives UI input values.
 * Steps only define sequence.
 */

/**
 * Parse a raw Excel row into a clean test case object.
 */
function parseExcelRow(row) {
  return {
    id:            (row['ID']              || '').trim(),
    title:         (row['Title']           || '').trim(),
    module:        (row['Module']          || '').trim(),
    priority:      (row['Priority']        || '').trim(),
    type:          (row['Type']            || '').trim(),
    preconditions: (row['Preconditions']   || '').trim(),
    steps:         parseSteps(row['Steps'] || ''),
    expectedResult:(row['Expected Result'] || '').trim(),
    rawTestData:   (row['Test Data']       || '').trim(),
    testData:      parseTestData(row['Test Data'] || ''),
  };
}

/**
 * Split semicolon/newline-separated steps into an array.
 */
function parseSteps(raw) {
  return raw
    .split(/;|\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Parse the free-text Test Data cell into a structured object.
 * Handles all patterns seen across the 26 STR test cases.
 */
function parseTestData(raw) {
  if (!raw) return {};
  const d = {};

  // ── PROPERTY ─────────────────────────────────────────────────────────────
  match(raw, /Property:\s*([^.\n]+)/i,    v => d.property = v);

  // ── LISTING FIELDS ────────────────────────────────────────────────────────
  match(raw, /Listing Title:\s*([^.\n]+)/i,       v => d.listing_title = v);
  match(raw, /Description tags?:\s*([^.\n]+)/i,   v => {
    d.description_tags = v.split(',').map(t => t.trim()).filter(Boolean);
    d.description = d.description_tags.join(', ');
  });

  // ── PRICING ───────────────────────────────────────────────────────────────
  // "$245/night" or "Base Rate: $245" or "Pricing: $245/night"
  match(raw, /\$(\d+)\/night/i,                    v => d.nightly_rate = v);
  match(raw, /(?:Base Rate|Nightly Rate)[\s:$]+(\d+)/i, v => d.nightly_rate = d.nightly_rate || v);
  match(raw, /Cleaning Fee[\s:$]+(\d+)/i,          v => d.cleaning_fee = v);
  match(raw, /Min(?:imum)? Stay[\s:]+(\d+)/i,      v => d.min_stay = v);
  match(raw, /Max(?:imum)? Stay[\s:]+(\d+)/i,      v => d.max_stay = v);

  // ── CHANNELS ──────────────────────────────────────────────────────────────
  // "Publish channel: Airbnb first" or "channels: Airbnb, VRBO"
  const channelBlock = raw.match(/(?:Publish )?channels?:\s*([^.\n]+)/i);
  if (channelBlock) {
    const txt = channelBlock[1];
    d.publish_channels = [];
    if (/airbnb/i.test(txt)) d.publish_channels.push('Airbnb');
    if (/vrbo/i.test(txt))   d.publish_channels.push('VRBO');
    if (/direct/i.test(txt)) d.publish_channels.push('Direct');
    // First mentioned = priority channel
    d.publish_priority = d.publish_channels[0] || null;
  }

  // ── BOOKING FIELDS ────────────────────────────────────────────────────────
  // "Guest: Emily Carter, emily@test.com, +1-512-555-0184"
  const guestBlock = raw.match(/Guest:\s*([^,\n]+),\s*([^,\n]+),\s*([^\n.]+)/i);
  if (guestBlock) {
    d.guest_name  = guestBlock[1].trim();
    d.guest_email = guestBlock[2].trim();
    d.guest_phone = guestBlock[3].trim();
  }
  match(raw, /Check-in:\s*(\d{4}-\d{2}-\d{2})/i,  v => d.checkin_date = v);
  match(raw, /Check-out:\s*(\d{4}-\d{2}-\d{2})/i,  v => d.checkout_date = v);
  match(raw, /Guests:\s*(\d+)/i,                    v => d.num_guests = v);
  match(raw, /Channel:\s*(\w+)/i,                   v => d.booking_channel = v);
  match(raw, /Booking ID:\s*([^\n.]+)/i,            v => d.booking_id = v.trim());

  // ── CALENDAR / iCAL ───────────────────────────────────────────────────────
  match(raw, /iCal URL:\s*(https?:\/\/[^\s.]+)/i,   v => d.ical_url = v);
  match(raw, /Sync interval:\s*(\d+)/i,             v => d.sync_interval = v);
  const genericUrl = raw.match(/https?:\/\/[^\s]+\.ics[^\s]*/i);
  if (genericUrl) d.ical_url = d.ical_url || genericUrl[0];

  // ── SUPPLY FIELDS ─────────────────────────────────────────────────────────
  match(raw, /Item:\s*([^.\n]+)/i,     v => d.supply_item = v);
  match(raw, /Quantity:\s*(\d+)/i,     v => d.quantity = v);

  // ── MAINTENANCE ───────────────────────────────────────────────────────────
  match(raw, /Issue:\s*([^.\n]+)/i,    v => d.issue_title = v);

  // ── SOURCE URL ────────────────────────────────────────────────────────────
  const urlMatch = raw.match(/https?:\/\/(?!.*\.ics)[^\s]+/i);
  if (urlMatch) d.source_url = urlMatch[0].replace(/[.,]$/, '');

  // ── BUSINESS NAME (onboarding) ───────────────────────────────────────────
  match(raw, /Business:\s*([^.\n]+)/i, v => d.business_name = v);

  return d;
}

// Helper: run regex, trim match, call setter
function match(text, re, setter) {
  const m = text.match(re);
  if (m) setter(m[1].trim());
}

module.exports = { parseExcelRow, parseTestData };
