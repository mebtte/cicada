import { parseBlob, selectCover } from 'music-metadata';

interface Metadata {
  title?: string;
  artist?: string;
  picture?: {
    dataURI: string;
    format: string; // like image/jpeg
  };
  year?: number;
  durationMs?: number;
  codec?: string;
  bitRate?: number;
}

// 将封面字节数据转成 data URI, 用于直接在 <img src> 中预览
function pictureToDataURI(data: Uint8Array, format: string) {
  let binary = '';
  for (let i = 0; i < data.length; i += 1) {
    binary += String.fromCharCode(data[i]);
  }
  return `data:${format};base64,${globalThis.btoa(binary)}`;
}

function normalizeCodec(codec?: string) {
  const value = codec?.split('/').pop()?.trim();
  // MP3 is often reported by parsers as its formal codec name.
  if (/^(mp3|mpeg[\s-]*(1|2|2\.5)?\s*(audio\s*)?layer\s*(3|iii))$/i.test(value || '')) {
    return 'MP3';
  }
  return value || undefined;
}

async function getMusicFileMetadata(file: Blob): Promise<Metadata> {
  const { common, format } = await parseBlob(file);
  const cover = selectCover(common.picture);
  return {
    title: common.title,
    artist: common.artist,
    picture: cover
      ? {
          dataURI: pictureToDataURI(cover.data, cover.format),
          format: cover.format,
        }
      : undefined,
    year: common.year || undefined,
    durationMs: format.duration ? Math.round(format.duration * 1000) : undefined,
    codec: normalizeCodec(format.codec),
    bitRate: format.bitrate || undefined,
  };
}

export type { Metadata };
export default getMusicFileMetadata;
