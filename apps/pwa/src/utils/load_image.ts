import timeoutFn from '@/utils/timeout';
import { t } from '@/i18n';

const loadedImageSrcSet = new Set<string>();
const pendingImageLoadMap = new Map<string, Promise<HTMLImageElement>>();

export function isImageLoaded(url: string) {
  return loadedImageSrcSet.has(url);
}

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
  const pendingImageLoad = pendingImageLoadMap.get(url);
  if (pendingImageLoad) {
    return pendingImageLoad;
  }

  const imgNode = document.createElement('img');
  imgNode.crossOrigin = 'anonymous';

  const imageLoadPromise = Promise.race([
    new Promise<HTMLImageElement>((resolve, reject) => {
      imgNode.onload = () => resolve(imgNode);
      imgNode.onerror = () =>
        reject(new Error(`Failed to load image "${url}"`));
    }),
    timeoutFn(timeout).catch(() =>
      Promise.reject(
        timeoutErrorGenerator
          ? timeoutErrorGenerator(timeout)
          : new Error(t('timeout', timeout.toString())),
      ),
    ),
  ])
    .then((image) => {
      loadedImageSrcSet.add(url);
      return image;
    })
    .finally(() => pendingImageLoadMap.delete(url));

  pendingImageLoadMap.set(url, imageLoadPromise);
  imgNode.src = url;
  return imageLoadPromise;
}

export default loadImage;
