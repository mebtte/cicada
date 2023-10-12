function getResizedImage({ url, size }: { url: string; size: number }) {
  if (url) {
    return `${url}?size=${size}`;
  }
  return url;
}

export default getResizedImage;
