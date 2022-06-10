const { setTimeout } = globalThis;

function timeout(ms: number, errorGenerator?: (ms: number) => void) {
  return new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          errorGenerator ? errorGenerator(ms) : new Error(`任务超时 ${ms}ms.`),
        ),
      ms,
    ),
  );
}

export default timeout;
