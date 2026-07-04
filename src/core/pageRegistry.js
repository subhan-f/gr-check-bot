const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', '..', 'config', 'pages');

function loadPageConfigs(dir = PAGES_DIR) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.page.json'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const config = JSON.parse(raw);
    validatePageConfig(config, file);
    return config;
  });
}

function validatePageConfig(config, sourceFile) {
  if (!config.id) throw new Error(`Page config in ${sourceFile} is missing "id"`);
  if (!config.elements) throw new Error(`Page config "${config.id}" is missing "elements"`);
  if (!Array.isArray(config.steps)) throw new Error(`Page config "${config.id}" is missing "steps"`);

  for (const step of config.steps) {
    if (!config.elements[step.element]) {
      throw new Error(
        `Page config "${config.id}" step references unknown element "${step.element}"`,
      );
    }
  }
}

function matches(config, { url, title }) {
  const { match } = config;
  if (!match) return false;
  if (match.urlIncludes && !url.includes(match.urlIncludes)) return false;
  if (match.titleEquals && title !== match.titleEquals) return false;
  return true;
}

class PageRegistry {
  constructor(dir = PAGES_DIR) {
    this.configs = loadPageConfigs(dir);
  }

  findByContext({ url, title }) {
    return this.configs.find((config) => matches(config, { url, title }));
  }

  findById(id) {
    return this.configs.find((config) => config.id === id);
  }

  all() {
    return this.configs;
  }
}

module.exports = { PageRegistry };
