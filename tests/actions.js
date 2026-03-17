const { clickTab, smoothScroll, tryClick, tryFill } = require('./helpers');

// ── TC-STR-001 ── Complete STR Onboarding Wizard
async function TC_STR_001(page) {
  await tryClick(page, 'text=Get Started', 8000) ||
  await tryClick(page, 'text=Start Setup', 8000) ||
  await tryClick(page, 'text=Begin Onboarding', 8000);
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
  await page.waitForTimeout(2000);
  // Step through wizard if visible
  for (let step = 0; step < 6; step++) {
    const advanced = await tryClick(page, 'text=Next', 3000) ||
                     await tryClick(page, 'text=Continue', 3000);
    if (!advanced) break;
    await smoothScroll(page, 300);
    await page.waitForTimeout(1500);
  }
}

// ── TC-STR-002 ── Add STR Property via Onboarding
async function TC_STR_002(page) {
  await clickTab(page, 'Properties');
  await smoothScroll(page, 400);
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Add STR Property', 5000) ||
  await tryClick(page, 'text=Add Property', 5000);
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
}

// ── TC-STR-003 ── View STR Dashboard KPIs
async function TC_STR_003(page) {
  await clickTab(page, 'Dashboard');
  await page.waitForTimeout(2000);
  await page.mouse.move(640, 300);
  await smoothScroll(page, 600);
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
}

// ── TC-STR-004 ── Create New STR Listing
async function TC_STR_004(page) {
  await clickTab(page, 'Listings');
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Create Listing', 5000) ||
  await tryClick(page, 'text=Add Listing', 5000) ||
  await tryClick(page, 'text=New Listing', 5000);
  await page.waitForTimeout(2000);
  await tryFill(page, 'input[placeholder*="title" i]', 'Deluxe New Condo Downtown Austin');
  await tryFill(page, 'textarea[placeholder*="description" i]', 'Pool view, EV charger, king bed, 361 Mbps wifi.');
  await smoothScroll(page, 500);
  await page.waitForTimeout(2000);
}

// ── TC-STR-005 ── Edit STR Listing Details
async function TC_STR_005(page) {
  await clickTab(page, 'Listings');
  await page.waitForTimeout(1500);
  await smoothScroll(page, 300);
  // Click first listing row
  await tryClick(page, 'tbody tr:first-child', 4000) ||
  await tryClick(page, '[data-testid="listing-row"]:first-child', 4000);
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Edit', 4000);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 400);
}

// ── TC-STR-006 ── Create Manual STR Booking
async function TC_STR_006(page) {
  await clickTab(page, 'Bookings');
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Create Booking', 5000) ||
  await tryClick(page, 'text=New Booking', 5000) ||
  await tryClick(page, 'text=Add Booking', 5000);
  await page.waitForTimeout(2000);
  await tryFill(page, 'input[placeholder*="guest name" i]', 'Emily Carter');
  await tryFill(page, 'input[placeholder*="email" i]', 'emily.carter@testguest.com');
  await tryFill(page, 'input[placeholder*="phone" i]', '+1-512-555-0184');
  await smoothScroll(page, 400);
  await page.waitForTimeout(2000);
}

// ── TC-STR-007 ── Cancel STR Booking
async function TC_STR_007(page) {
  await clickTab(page, 'Bookings');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 300);
  // Open first booking
  await tryClick(page, 'tbody tr:first-child', 4000);
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Cancel Booking', 4000) ||
  await tryClick(page, 'text=Cancel', 4000);
  await page.waitForTimeout(1500);
  // Confirm dialog
  await tryClick(page, '[role="dialog"] button:has-text("Confirm")', 3000) ||
  await tryClick(page, '[role="dialog"] button:has-text("Yes")', 3000);
  await page.waitForTimeout(2000);
}

// ── TC-STR-008 ── Complete Guest Check-in
async function TC_STR_008(page) {
  await clickTab(page, 'Bookings');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 300);
  await tryClick(page, 'tbody tr:first-child', 4000);
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Check In', 5000);
  await page.waitForTimeout(1500);
  await tryClick(page, '[role="dialog"] button:has-text("Confirm")', 3000) ||
  await tryClick(page, '[role="dialog"] button:has-text("Check In")', 3000);
  await page.waitForTimeout(2000);
}

// ── TC-STR-009 ── Complete Guest Check-out
async function TC_STR_009(page) {
  await clickTab(page, 'Bookings');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 300);
  await tryClick(page, 'tbody tr:first-child', 4000);
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Check Out', 5000);
  await page.waitForTimeout(1500);
  await tryClick(page, '[role="dialog"] button:has-text("Confirm")', 3000) ||
  await tryClick(page, '[role="dialog"] button:has-text("Check Out")', 3000);
  await page.waitForTimeout(2000);
}

// ── TC-STR-010 ── Connect iCal Feed from Airbnb
async function TC_STR_010(page) {
  await clickTab(page, 'Calendar');
  await page.waitForTimeout(2000);
  await tryClick(page, 'text=Connect Calendar', 5000) ||
  await tryClick(page, 'text=Add Calendar', 5000) ||
  await tryClick(page, 'text=Connect', 5000);
  await page.waitForTimeout(2000);
  await tryFill(page, 'input[placeholder*="ical" i]', 'https://www.airbnb.com/calendar/ical/1323477324100887109.ics');
  await tryFill(page, 'input[placeholder*="url" i]', 'https://www.airbnb.com/calendar/ical/1323477324100887109.ics');
  await smoothScroll(page, 300);
  await page.waitForTimeout(2000);
}

// ── TC-STR-011 ── View Calendar with Multi-Channel Bookings
async function TC_STR_011(page) {
  await clickTab(page, 'Calendar');
  await page.waitForTimeout(2000);
  await page.mouse.move(640, 400);
  await smoothScroll(page, 400);
  await page.waitForTimeout(2000);
  // Navigate months
  await tryClick(page, '[aria-label*="next" i]', 3000) ||
  await tryClick(page, 'button:has-text(">")', 3000);
  await page.waitForTimeout(1500);
}

// ── TC-STR-012 ── Prevent Double Booking Across Channels
async function TC_STR_012(page) {
  await clickTab(page, 'Calendar');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 300);
  await page.waitForTimeout(1500);
  await clickTab(page, 'Bookings');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
}

// ── TC-STR-013 ── Auto-Generate Cleaning Job on Checkout
async function TC_STR_013(page) {
  await clickTab(page, 'Cleaning');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 400);
}

// ── TC-STR-014 ── Create Manual Cleaning Job
async function TC_STR_014(page) {
  await clickTab(page, 'Cleaning');
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Create Cleaning Job', 5000) ||
  await tryClick(page, 'text=New Cleaning Job', 5000) ||
  await tryClick(page, 'text=Add Cleaning', 5000);
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
}

// ── TC-STR-015 ── Complete Cleaning Job with Checklist
async function TC_STR_015(page) {
  await clickTab(page, 'Cleaning');
  await page.waitForTimeout(1500);
  // Open first cleaning job
  await tryClick(page, 'tbody tr:first-child', 4000);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 300);
  // Check off checklist items
  const checkboxes = page.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < Math.min(count, 5); i++) {
    try {
      await checkboxes.nth(i).click();
      await page.waitForTimeout(500);
    } catch {}
  }
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Complete', 4000) ||
  await tryClick(page, 'text=Mark Complete', 4000);
  await page.waitForTimeout(2000);
}

// ── TC-STR-016 ── Add New Supply Item
async function TC_STR_016(page) {
  await clickTab(page, 'Supplies');
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Add Item', 5000) ||
  await tryClick(page, 'text=Add Supply', 5000) ||
  await tryClick(page, 'text=New Item', 5000);
  await page.waitForTimeout(2000);
  await tryFill(page, 'input[placeholder*="name" i]', 'Bathroom Towels');
  await tryFill(page, 'input[placeholder*="quantity" i]', '24');
  await smoothScroll(page, 300);
  await page.waitForTimeout(1500);
}

// ── TC-STR-017 ── Low Stock Alert Triggers
async function TC_STR_017(page) {
  await clickTab(page, 'Supplies');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
  await page.waitForTimeout(2000);
  // Look for low stock filter or section
  await tryClick(page, 'text=Low Stock', 4000);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 300);
}

// ── TC-STR-018 ── Send Guest Message with Variable Substitution
async function TC_STR_018(page) {
  await clickTab(page, 'Guest Messages');
  await page.waitForTimeout(2000);
  // Open first message thread
  await tryClick(page, '[data-testid="message-thread"]:first-child', 4000) ||
  await tryClick(page, 'tbody tr:first-child', 4000);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 300);
  // Type reply
  await tryFill(page, 'textarea[placeholder*="message" i]', 'Hi {{guest_name}}, your check-in is confirmed for {{checkin_date}}. Your access code is {{access_code}}. Looking forward to hosting you!');
  await page.waitForTimeout(1500);
}

// ── TC-STR-019 ── View Guest Message History
async function TC_STR_019(page) {
  await clickTab(page, 'Guest Messages');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 500);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 400);
}

// ── TC-STR-020 ── Report Maintenance Issue from STR Module
async function TC_STR_020(page) {
  await clickTab(page, 'Maintenance');
  await page.waitForTimeout(1500);
  await tryClick(page, 'text=Report Issue', 5000) ||
  await tryClick(page, 'text=New Issue', 5000) ||
  await tryClick(page, 'text=Create Issue', 5000);
  await page.waitForTimeout(2000);
  await tryFill(page, 'input[placeholder*="title" i]', 'HVAC not cooling - Unit 4B');
  await tryFill(page, 'textarea[placeholder*="description" i]', 'Guest reported AC unit not cooling below 78°F. Priority maintenance before next check-in.');
  await smoothScroll(page, 400);
  await page.waitForTimeout(1500);
}

// ── TC-STR-021 ── View Revenue Report with Date Range
async function TC_STR_021(page) {
  await clickTab(page, 'Reports');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 300);
  // Set date range if picker exists
  await tryClick(page, '[placeholder*="start" i]', 3000) ||
  await tryClick(page, 'text=Date Range', 3000);
  await page.waitForTimeout(1000);
  await smoothScroll(page, 500);
  await page.waitForTimeout(2000);
}

// ── TC-STR-022 ── Export Property Performance CSV
async function TC_STR_022(page) {
  await clickTab(page, 'Reports');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 300);
  await tryClick(page, 'text=Export', 5000) ||
  await tryClick(page, 'text=Export CSV', 5000) ||
  await tryClick(page, 'text=Download', 5000);
  await page.waitForTimeout(2000);
}

// ── TC-STR-023 ── Channel Mix Breakdown
async function TC_STR_023(page) {
  await clickTab(page, 'Reports');
  await page.waitForTimeout(2000);
  await tryClick(page, 'text=Channel Mix', 4000) ||
  await tryClick(page, 'text=Channel Breakdown', 4000) ||
  await tryClick(page, 'text=Channels', 4000);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 400);
  await page.waitForTimeout(2000);
}

// ── TC-STR-024 ── Configure STR Default Settings
async function TC_STR_024(page) {
  await clickTab(page, 'Settings');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 400);
  await page.waitForTimeout(1500);
}

// ── TC-STR-025 ── Configure Calendar Sync Interval
async function TC_STR_025(page) {
  await clickTab(page, 'Settings');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 300);
  await tryClick(page, 'text=Calendar Sync', 4000) ||
  await tryClick(page, 'text=Sync Interval', 4000) ||
  await tryClick(page, 'text=Sync Settings', 4000);
  await page.waitForTimeout(1500);
  await smoothScroll(page, 300);
}

// ── TC-STR-026 ── Operator Data Isolation for STR
async function TC_STR_026(page) {
  await page.waitForTimeout(1500);
  await smoothScroll(page, 300);
  // Check operator label / org indicator in header
  await page.mouse.move(200, 100);
  await page.waitForTimeout(1000);
  await clickTab(page, 'Dashboard');
  await page.waitForTimeout(2000);
  await smoothScroll(page, 400);
}

module.exports = {
  'TC-STR-001': TC_STR_001,
  'TC-STR-002': TC_STR_002,
  'TC-STR-003': TC_STR_003,
  'TC-STR-004': TC_STR_004,
  'TC-STR-005': TC_STR_005,
  'TC-STR-006': TC_STR_006,
  'TC-STR-007': TC_STR_007,
  'TC-STR-008': TC_STR_008,
  'TC-STR-009': TC_STR_009,
  'TC-STR-010': TC_STR_010,
  'TC-STR-011': TC_STR_011,
  'TC-STR-012': TC_STR_012,
  'TC-STR-013': TC_STR_013,
  'TC-STR-014': TC_STR_014,
  'TC-STR-015': TC_STR_015,
  'TC-STR-016': TC_STR_016,
  'TC-STR-017': TC_STR_017,
  'TC-STR-018': TC_STR_018,
  'TC-STR-019': TC_STR_019,
  'TC-STR-020': TC_STR_020,
  'TC-STR-021': TC_STR_021,
  'TC-STR-022': TC_STR_022,
  'TC-STR-023': TC_STR_023,
  'TC-STR-024': TC_STR_024,
  'TC-STR-025': TC_STR_025,
  'TC-STR-026': TC_STR_026,
};
