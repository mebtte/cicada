import jsmediatags from 'jsmediatags';

interface Metadata {
  title?: string;
  artist?: string;
  picture?: {
    dataURI: string;
    format: string; // like image/jpeg
  };
  year?: number;
}

function pictureToDataURI(picture: { data: number[]; format: string }) {
  return `data:${picture.format};base64,${globalThis.btoa(
    picture.data.map((item) => String.fromCharCode(item)).join(''),
  )}`;
}

function getMusicFileMetadata(file: File | string) {
  return new Promise<Metadata>((resolve, reject) => {
    jsmediatags.read(file, {
      onSuccess: async (metadata) => {
        const { picture, title, artist, year } = metadata.tags;

        return resolve({
          title,
          artist,
          picture: picture
            ? {
                dataURI: pictureToDataURI(picture),
                format: picture.format,
              }
            : undefined,
          year: (year ? Number(year) : undefined) || undefined,
        });
      },
      onError: reject,
    });
  });
}

export type { Metadata };
export default getMusicFileMetadata;
