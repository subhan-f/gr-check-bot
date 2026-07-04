const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://pk-gr-services.gvcworld.eu/';
const OUT_DIR = path.join(__dirname);

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  const html = await page.content();
  fs.writeFileSync(path.join(OUT_DIR, 'page.html'), html);

  // dump a simplified snapshot of interactive elements
  const elements = await page.evaluate(() => {
    function describe(el) {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        id: el.id || null,
        name: el.getAttribute('name'),
        placeholder: el.getAttribute('placeholder'),
        label: (() => {
          if (el.id) {
            const lbl = document.querySelector(`label[for="${el.id}"]`);
            if (lbl) return lbl.innerText.trim();
          }
          const closestLabel = el.closest('label');
          if (closestLabel) return closestLabel.innerText.trim();
          return null;
        })(),
        ariaLabel: el.getAttribute('aria-label'),
        required: el.hasAttribute('required'),
        classList: el.className && typeof el.className === 'string' ? el.className : null,
        value: el.value !== undefined ? el.value : null,
        options: el.tagName.toLowerCase() === 'select'
          ? Array.from(el.options).map(o => ({ value: o.value, text: o.text }))
          : null,
        visible: !!(rect.width || rect.height),
        text: el.tagName.toLowerCase() === 'button' || el.tagName.toLowerCase() === 'a' ? el.innerText.trim() : null,
      };
    }
    const selectors = 'input, select, textarea, button, a[role="button"], [role="button"]';
    return Array.from(document.querySelectorAll(selectors)).map(describe);
  });

  fs.writeFileSync(path.join(OUT_DIR, 'elements.raw.json'), JSON.stringify(elements, null, 2));

  console.log('Saved page.html and elements.raw.json');
  console.log('Title:', await page.title());
  console.log('URL after load:', page.url());

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
