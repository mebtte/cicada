export default <Keys extends string>(search: string) => {
  const query: {
    [key in Keys]?: string;
  } = {};
  const s = search.replace(/\?/g, '');
  if (s) {
    s.split('&').forEach((kv) => {
      const [key, value] = kv.split('=');
      query[key] = decodeURIComponent(value);
    });
  }
  return query;
};
