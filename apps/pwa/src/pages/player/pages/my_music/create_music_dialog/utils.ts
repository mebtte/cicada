import { IMAGE_MAX_SIZE } from '#/constants';
import loadImage from '@/utils/load_image';

export async function base64ToCover(base64: string) {
  const imgNode = await loadImage(base64);

  const size = Math.min(
    IMAGE_MAX_SIZE,
    imgNode.naturalWidth,
    imgNode.naturalHeight,
  );
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!;

  context.drawImage(
    imgNode,
    (size - imgNode.naturalWidth) / 2,
    (size - imgNode.naturalHeight) / 2,
    imgNode.naturalWidth,
    imgNode.naturalHeight,
  );
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8),
  );
}

export function canAudioPlay(file: File) {
  const url = URL.createObjectURL(file);
  const audio = new Audio();
  return new Promise<boolean>((resolve) => {
    audio.muted = true;
    audio.autoplay = true;
    audio.onplay = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.src = url;
  }).finally(() => {
    audio.pause();
    URL.revokeObjectURL(url);
  });
}

export function getMusicNameFromFilename(filename: string) {
  const lastIndex = filename.lastIndexOf('.');
  return lastIndex === -1
    ? filename
    : lastIndex === 0
    ? ''
    : filename.slice(0, lastIndex);
}
