function getResizedMusicCover({
  cover,
  size,
}: {
  cover: string;
  size: 96 | 128 | 192 | 256 | 384 | 512;
}) {
  return `${cover}?size=${size}`;
}

export default getResizedMusicCover;
