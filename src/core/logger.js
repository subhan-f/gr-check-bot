const LEVELS = ['debug', 'info', 'warn', 'error'];

function createLogger(scope) {
  const prefix = scope ? `[${scope}]` : '';

  function log(level, ...args) {
    const method = console[level] || console.log;
    method(prefix, ...args);
  }

  const logger = {};
  for (const level of LEVELS) {
    logger[level] = (...args) => log(level, ...args);
  }
  return logger;
}

module.exports = { createLogger };
