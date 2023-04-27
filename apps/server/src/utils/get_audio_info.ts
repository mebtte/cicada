/* eslint-disable no-unused-expressions */
import MediaInfoFactory, {
  Result,
  MediaInfo,
  ReadChunkFunc,
} from 'mediainfo.js';
import fsPromises from 'fs/promises';

let mediainfo: MediaInfo | undefined;
async function getMediaInfo() {
  if (!mediainfo) {
    mediainfo = await MediaInfoFactory();
  }
  return mediainfo;
}

async function getAudioInfo(file: string) {
  let fileHandle: fsPromises.FileHandle | undefined;

  const readChunk: ReadChunkFunc = async (size, offset) => {
    const buffer = new Uint8Array(size);
    await (fileHandle as fsPromises.FileHandle).read(buffer, 0, size, offset);
    return buffer;
  };

  try {
    fileHandle = await fsPromises.open(file, 'r');
    const fileSize = (await fileHandle.stat()).size;
    const mi = await getMediaInfo();
    // @ts-expect-error
    const result: Exclude<Result, string> = await mi.analyzeData(
      () => fileSize,
      readChunk,
    );
    const audio = result.media.track.find((t) => t['@type'] === 'Audio');
    if (!audio) {
      throw new Error('File do not have audio track');
    }
    return {
      duration: Math.floor(Number(audio.Duration) * 1000),
    };
  } finally {
    fileHandle && (await fileHandle.close());
  }
}

export default getAudioInfo;
