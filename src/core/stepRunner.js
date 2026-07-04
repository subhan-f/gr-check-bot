const { createLogger } = require('./logger');
const { runStep } = require('./interactor');

const logger = createLogger('stepRunner');

async function runPageSteps(page, pageConfig) {
  logger.info(`Running steps for page "${pageConfig.id}"`);

  for (const step of pageConfig.steps) {
    await runStep(page, pageConfig, step);
  }

  if (pageConfig.onSuccess && pageConfig.onSuccess.waitFor === 'navigation') {
    await page.waitForNavigation({ timeout: pageConfig.onSuccess.timeoutMs || 30000 });
    logger.info(`Page "${pageConfig.id}" completed, navigated to ${page.url()}`);
  }
}

module.exports = { runPageSteps };
