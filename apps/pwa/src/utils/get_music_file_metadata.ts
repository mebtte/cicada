import { IMAGE_MAX_SIZE } from '#/constants';
import jsmediatags from 'jsmediatags';
import loadImage from './load_image';

interface Metadata {
  lyric?: string;
  title?: string;
  artist?: string;
  pictureBase64?: string;
}

function getPictureBase64(picture: { data: number[]; format: string }) {
  let base64String = '';
  for (let i = 0; i < picture.data.length; i += 1) {
    base64String += String.fromCharCode(picture.data[i]);
  }
  return `data:${picture?.format};base64,${window.btoa(base64String)}`;
}

async function base64ToCover(base64: string) {
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
  return new Promise<Blob>((rs) =>
    canvas.toBlob((blob) => rs(blob!), 'image/jpeg', 0.8),
  );
}

function getMusicFileMetadata(file: File) {
  return new Promise<Metadata>((resolve, reject) => {
    jsmediatags.read(file, {
      onSuccess: async (metadata) => {
        const { lyrics, picture, title, artist } = metadata.tags;

        return resolve({
          title,
          artist,
          lyric: lyrics,
          pictureBase64: picture ? getPictureBase64(picture) : undefined,
        });
      },
      onError: reject,
    });
  });
}

export { Metadata, base64ToCover };
export default getMusicFileMetadata;
