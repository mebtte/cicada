function timeout(
  ms: number,
  {
    errorGenerator,
  }: {
    errorGenerator?: (ms: number) => void;
  } = {},
) {
  return new Promise<never>((_, reject) =>
    window.setTimeout(
      () =>
        reject(
          errorGenerator ? errorGenerator(ms) : new Error(`Timeouted ${ms}ms.`),
        ),
      ms,
    ),
  );
}

export default timeout;
