function timeout(ms: number, errorGenerator?: (ms: number) => Error) {
  return new Promise<never>((_, reject) =>
    global.setTimeout(
      () =>
        reject(
          errorGenerator ? errorGenerator(ms) : new Error(`任务超时 ${ms}ms.`),
        ),
      ms,
    ),
  );
}

export default timeout;
