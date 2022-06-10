import timeoutFn from './timeout';

function withTimeout<Fn extends (...params: unknown[]) => Promise<unknown>>(
  fn: Fn,
  timeout: number,
  timeoutErrorGenerator?: (ms: number) => Error,
) {
  return (...params: Parameters<Fn>): ReturnType<Fn> =>
    // @ts-expect-error
    Promise.race([fn(params), timeoutFn(timeout, timeoutErrorGenerator)]);
}

export default withTimeout;
