function resolveValue(source) {
  if (!source) return undefined;

  switch (source.type) {
    case 'env': {
      const value = process.env[source.key];
      if (value === undefined) {
        throw new Error(`Missing required environment variable "${source.key}"`);
      }
      return value;
    }
    case 'static':
      return source.value;
    default:
      throw new Error(`Unknown field source type "${source.type}"`);
  }
}

module.exports = { resolveValue };
