const { chromium } = require('playwright');

async function launchBrowser({ headless = false } = {}) {
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();
  return { browser, page };
}

module.exports = { launchBrowser };
