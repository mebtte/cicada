function parseSearch<Keys extends string>(search: string) {
  return Object.fromEntries(new URLSearchParams(search).entries()) as {
    [key in Keys]?: string;
  };
}

export default parseSearch;
