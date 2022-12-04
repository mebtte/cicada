import timeoutFn from '#/utils/timeout';

function loadImage(
  url: string,
  {
    timeout = 10 * 1000,
    timeoutErrorGenerator,
  }: {
    timeout?: number;
    timeoutErrorGenerator?: (ms: number) => Error;
  } = {},
) {
  return Promise.race([
    window.fetch(url),
    timeoutFn(timeout, timeoutErrorGenerator),
  ]);
}

export default loadImage;
