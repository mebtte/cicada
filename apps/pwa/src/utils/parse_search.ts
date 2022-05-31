function parseSearch<Keys extends string>(search?: string) {
  const query: {
    [key in Keys]?: string;
  } = {};
  if (search) {
    const s = search.replace(/\?/g, '');
    s.split('&').forEach((kv) => {
      const [key, value] = kv.split('=');
      query[key] = decodeURIComponent(value);
    });
  }
  return query;
}

export default parseSearch;
