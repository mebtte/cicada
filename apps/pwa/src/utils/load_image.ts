const TIMEOUT = 30 * 1000;

export default (
  url: string,
  {
    timeout = TIMEOUT,
  }: {
    timeout?: number;
  } = {},
) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    let finished = false;
    setTimeout(() => {
      if (finished) {
        return;
      }
      finished = true;
      return reject(new Error(`加载图片超时"${url}"`));
    }, timeout);
    const image = document.createElement('img');
    image.src = url;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`加载图片失败"${url}"`));
  });
