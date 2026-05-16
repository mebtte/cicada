import getMusicFileMetadata from '@/utils/get_music_file_metadata';
import { getMusicNameFromFilename } from '@/utils/music_file';

export interface ParsedMusicFile {
  name: string;
  parsed: {
    title?: string;
    artist?: string;
    year?: number;
    pictureDataURI?: string;
    durationMs?: number;
    codec?: string;
    bitRate?: number;
  };
}

/**
 * Reads tags off a music file. Falls back to the filename-derived name
 * when the file is not standard or metadata parsing fails. Never throws so
 * callers can use it inside Promise.all without unwinding.
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
        durationMs: metadata.durationMs,
        codec: metadata.codec,
        bitRate: metadata.bitRate,
      },
    };
  } catch {
    return {
      name: getMusicNameFromFilename(file.name) || file.name,
      parsed: {},
    };
  }
}
