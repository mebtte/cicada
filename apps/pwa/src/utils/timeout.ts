function timeout(ms: number) {
  return new Promise<never>((_resolve, reject) =>
    global.setTimeout(() => reject(new Error(`Timeout of ${ms}ms.`)), ms),
  );
}

export default timeout;
