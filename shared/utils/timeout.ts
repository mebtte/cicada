function timeout(ms: number, errorGenerator?: (ms: number) => Error) {
  return new Promise<never>((_, reject) =>
    global.setTimeout(
      () =>
        reject(
          errorGenerator ? errorGenerator(ms) : new Error(`${ms}ms timeouted.`),
        ),
      ms,
    ),
  );
}

export default timeout;
