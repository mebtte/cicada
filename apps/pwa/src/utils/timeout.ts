function timeout(ms: number) {
  return new Promise<never>((_resolve, reject) =>
    globalThis.setTimeout(() => reject(new Error(`Timeout of ${ms}ms.`)), ms),
  );
}

export default timeout;
