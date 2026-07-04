async function identifyPage(page, registry, { timeoutMs = 10000, pollMs = 200 } = {}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const context = { url: page.url(), title: await page.title() };
    const match = registry.findByContext(context);
    if (match) return match;
    await page.waitForTimeout(pollMs);
  }

  return null;
}

module.exports = { identifyPage };
