import timeoutFn from './timeout';

function withTimeout<Fn extends (...params: unknown[]) => Promise<unknown>>(
  fn: Fn,
  timeout: number,
  timeoutErrorGenerator: (ms: number) => Error,
) {
  return (...params: Parameters<Fn>): ReturnType<Fn> =>
    // @ts-expect-error: known types
    Promise.race([
      fn(params),
      timeoutFn(timeout).catch(() =>
        Promise.reject(timeoutErrorGenerator(timeout)),
      ),
    ]);
}

export default withTimeout;
