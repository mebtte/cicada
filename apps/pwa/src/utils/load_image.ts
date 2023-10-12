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
  const imgNode = document.createElement('img');
  imgNode.src = url;
  imgNode.crossOrigin = 'anonymous';

  return Promise.race([
    new Promise<HTMLImageElement>((resolve, reject) => {
      imgNode.onload = () => resolve(imgNode);
      imgNode.onerror = () =>
        reject(new Error(`Failed to load image "${url}"`));
    }),
    timeoutFn(timeout, timeoutErrorGenerator),
  ]);
}

export default loadImage;
