import getMusicFileMetadata from '@/utils/get_music_file_metadata';
import { getMusicNameFromFilename } from '@/utils/music_file';

export interface ParsedMusicFile {
  name: string;
  parsed: {
    title?: string;
    artist?: string;
    year?: number;
    pictureDataURI?: string;
  };
}

/**
 * Reads ID3 tags off a music file. Falls back to the filename-derived name
 * when the file is not standard or jsmediatags fails. Never throws so callers
 * can use it inside Promise.all without unwinding.
 */
export async function parseMusicFile(file: File): Promise<ParsedMusicFile> {
  try {
    const metadata = await getMusicFileMetadata(file);
    return {
      name: metadata.title || getMusicNameFromFilename(file.name) || file.name,
      parsed: {
        title: metadata.title,
        artist: metadata.artist,
        year: metadata.year,
        pictureDataURI: metadata.picture?.dataURI,
      },
    };
  } catch {
    return {
      name: getMusicNameFromFilename(file.name) || file.name,
      parsed: {},
    };
  }
}
