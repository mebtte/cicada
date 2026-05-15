import { useCallback } from 'react';
import { AssetType } from '@/constants/asset';
import { MusicType } from '@/constants/music';
import {
  addTasks,
  ImportTask,
} from '@/global_states/music_import';
import getAssetMaxSize from '@/utils/get_asset_max_size';
import formatBytes from '@/utils/format_bytes';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import { parseMusicFile } from './use_parse_metadata';

/**
 * Validates a list of File objects against the server-published asset cap,
 * parses ID3 metadata for the accepted ones, and adds them to the import
 * store as `editing` tasks.
 */
export default function useSelectFiles() {
  return useCallback(async (files: File[]) => {
    if (!files.length) return;

    const limit = getAssetMaxSize(AssetType.MUSIC);
    const oversize = files.filter((f) => f.size > limit);
    if (oversize.length) {
      notice.error(
        t(
          'asset_oversize_warning',
          oversize.map((f) => f.name).join(', '),
          formatBytes(limit),
        ),
      );
    }
    const accepted = files.filter((f) => f.size <= limit);
    if (!accepted.length) return;

    try {
      const parsed = await Promise.all(accepted.map(parseMusicFile));
      const now = Date.now();
      const newTasks: ImportTask[] = accepted.map((file, i) => ({
        id: `import-${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        parsed: parsed[i].parsed,
        name: parsed[i].name,
        singers: [],
        type: MusicType.SONG,
        phase: 'editing',
        uploadedBytes: 0,
        totalBytes: file.size,
        speedBps: 0,
        createdAt: now,
      }));
      addTasks(newTasks);
    } catch (error) {
      logger.error(error as Error, 'Failed to parse selected music files');
    }
  }, []);
}
