function getResizedMusicCover({
  cover,
  size,
}: {
  cover: string;
  size: number;
}) {
  return `${cover}?size=${size}`;
}

export default getResizedMusicCover;
