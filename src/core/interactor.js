const { createLogger } = require('./logger');
const { resolveValue } = require('./fieldResolver');
const { solveWithCapsolver } = require('./captcha');

const logger = createLogger('interactor');

async function waitForElement(page, selector, waitFor) {
  if (!waitFor) return;
  const stateMap = { visible: 'visible', enabled: 'visible', attached: 'attached' };
  await page.waitForSelector(selector, { state: stateMap[waitFor] || 'visible' });
}

async function fill(page, element, elementName) {
  await waitForElement(page, element.selector, element.waitFor);
  const value = resolveValue(element.source);
  await page.fill(element.selector, value);
  logger.info(`Filled "${elementName}"${element.sensitive ? '' : `: ${value}`}`);
}

async function click(page, element, elementName) {
  await waitForElement(page, element.selector, element.waitFor || 'enabled');
  await page.click(element.selector);
  logger.info(`Clicked "${elementName}"`);
}

async function waitForHuman(page, element, elementName, { instructions, timeoutMs }) {
  logger.warn(`Manual action required for "${elementName}": ${instructions}`);
  if (!element.responseSelector) {
    throw new Error(`Element "${elementName}" has no responseSelector to poll for completion`);
  }

  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return !!(el && el.value && el.value.length > 0);
    },
    element.responseSelector,
    { timeout: timeoutMs || 120000 },
  );
  logger.info(`Human step "${elementName}" completed.`);
}

async function solveCaptcha(page, element, elementName, { instructions, timeoutMs }) {
  const apiKey = process.env.CAPSOLVER_API_KEY;

  if (apiKey) {
    logger.info(`Auto-solving "${elementName}" via CapSolver...`);
    try {
      await solveWithCapsolver(element, page, { apiKey });
      logger.info(`CapSolver solved "${elementName}".`);
      return;
    } catch (err) {
      logger.warn(`CapSolver failed for "${elementName}": ${err.message}. Falling back to manual solve.`);
    }
  } else {
    logger.warn('CAPSOLVER_API_KEY not set. Falling back to manual solve.');
  }

  await waitForHuman(page, element, elementName, { instructions, timeoutMs });
}

async function runStep(page, pageConfig, step) {
  const element = pageConfig.elements[step.element];

  switch (step.action) {
    case 'fill':
      return fill(page, { ...element, waitFor: step.waitFor }, step.element);
    case 'click':
      return click(page, { ...element, waitFor: step.waitFor }, step.element);
    case 'waitForHuman':
      return waitForHuman(page, element, step.element, {
        instructions: step.instructions,
        timeoutMs: step.timeoutMs,
      });
    case 'solveCaptcha':
      return solveCaptcha(page, element, step.element, {
        instructions: step.instructions,
        timeoutMs: step.timeoutMs,
      });
    default:
      throw new Error(`Unknown step action "${step.action}"`);
  }
}

module.exports = { runStep };
