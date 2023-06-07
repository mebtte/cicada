function getResizedImage({ url, size }: { url: string; size: number }) {
  return `${url}?size=${size}`;
}

export default getResizedImage;
