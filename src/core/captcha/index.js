const { solveRecaptchaV2 } = require('./capsolverClient');

const PROVIDERS = {
  'recaptcha-v2-checkbox': async (element, page, { apiKey }) => {
    const token = await solveRecaptchaV2({
      apiKey,
      websiteURL: page.url(),
      websiteKey: element.sitekey,
    });
    await page.evaluate(
      ({ selector, value }) => {
        document.querySelector(selector).value = value;
      },
      { selector: element.responseSelector, value: token },
    );
  },
};

async function solveWithCapsolver(element, page, { apiKey }) {
  const solve = PROVIDERS[element.provider];
  if (!solve) throw new Error(`No CapSolver mapping for captcha provider "${element.provider}"`);
  await solve(element, page, { apiKey });
}

module.exports = { solveWithCapsolver };
