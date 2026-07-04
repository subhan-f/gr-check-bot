require('dotenv').config();

const { launchBrowser } = require('./core/browser');
const { PageRegistry } = require('./core/pageRegistry');
const { identifyPage } = require('./core/pageIdentifier');
const { runPageSteps } = require('./core/stepRunner');
const { createLogger } = require('./core/logger');

const logger = createLogger('bot');

const START_URL = process.env.GR_START_URL || 'https://pk-gr-services.gvcworld.eu/';
const KEEP_OPEN_MS = Number(process.env.GR_KEEP_OPEN_MS || 3 * 60 * 1000);

async function main() {
  const registry = new PageRegistry();
  const { browser, page } = await launchBrowser({ headless: false });

  logger.info(`Opening ${START_URL}`);
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' });

  const pageConfig = await identifyPage(page, registry);

  if (!pageConfig) {
    logger.warn('No matching page config found for current page. Skipping automated steps.');
  } else {
    await runPageSteps(page, pageConfig);
  }

  logger.info(`Keeping browser open for ${KEEP_OPEN_MS / 1000}s.`);
  await page.waitForTimeout(KEEP_OPEN_MS);

  logger.info('Closing browser.');
  await browser.close();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
