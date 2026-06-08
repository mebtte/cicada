import { useCallback } from 'react';
import { AssetType } from '@/constants/asset';
import { MusicType } from '@/constants/music';
import {
  addTasks,
  ImportTask,
  ImportTaskSinger,
} from '@/global_states/music_import';
import getAssetMaxSize from '@/utils/get_asset_max_size';
import formatBytes from '@/utils/format_bytes';
import logger from '@/utils/logger';
import { t } from '@/i18n';
import dialog from '@/utils/dialog';
import searchArtistRequest from '@/server/api/search_artist';
import { parseMusicFile } from './use_parse_metadata';

type SearchArtistItem = Awaited<ReturnType<typeof searchArtistRequest>>['artistList'][number];

const artistSplitRegexp =
  /\s*(?:,|，|、|;|；|\+|＆|&|\/|／|×|\bx\b|\band\b|\bfeat\.?\b|\bft\.?\b|\bfeaturing\b)\s*/i;

const normalizeArtistName = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLowerCase();

function splitArtistNames(artist?: string) {
  if (!artist) return [];
  return Array.from(
    new Set(
      artist
        .split(artistSplitRegexp)
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  );
}

function singerMatchesName(singer: SearchArtistItem, name: string) {
  const normalizedName = normalizeArtistName(name);
  return (
    normalizeArtistName(singer.name) === normalizedName ||
    singer.aliases.some((alias) => normalizeArtistName(alias) === normalizedName)
  );
}

const singerCache = new Map<string, Promise<ImportTaskSinger | undefined>>();

function findExactSinger(name: string): Promise<ImportTaskSinger | undefined> {
  const normalizedName = normalizeArtistName(name);
  if (!normalizedName) return Promise.resolve(undefined);

  const cached = singerCache.get(normalizedName);
  if (cached) return cached;

  const request = searchArtistRequest({
    keyword: name,
    page: 1,
    pageSize: 20,
    requestMinimalDuration: 0,
  }).then(({ artistList }) => {
    const matched = artistList.find((singer) => singerMatchesName(singer, name));
    return matched ? { id: matched.id, name: matched.name } : undefined;
  });
  singerCache.set(normalizedName, request);
  return request;
}

async function resolveArtistSingers(artist?: string): Promise<ImportTaskSinger[]> {
  const trimmedArtist = artist?.trim();
  if (!trimmedArtist) return [];

  try {
    // Prefer an exact whole-artist match so names like "AC/DC" are not split
    // into unrelated singers when that artist already exists.
    const wholeMatch = await findExactSinger(trimmedArtist);
    if (wholeMatch) return [wholeMatch];

    const singers = await Promise.all(
      splitArtistNames(trimmedArtist).map(findExactSinger),
    );
    const deduped = new Map<string, ImportTaskSinger>();
    singers.forEach((singer) => {
      if (singer) {
        deduped.set(singer.id, singer);
      }
    });
    return Array.from(deduped.values());
  } catch (error) {
    logger.error(error as Error, `Failed to resolve artist ${trimmedArtist}`);
    return [];
  }
}

/**
 * Validates music files against the server-published asset cap, parses ID3
 * metadata for the accepted ones, and adds them to the import store as
 * `editing` tasks.
 */
export default function useSelectFiles() {
  return useCallback(async (files: File[]) => {
    if (!files.length) return;

    const limit = getAssetMaxSize(AssetType.MUSIC);
    if (limit) {
      const oversize = files.filter((f) => f.size > limit);
      if (oversize.length) {
        dialog.alert({
          content: t(
            'asset_oversize_warning',
            oversize.map((f) => f.name).join(', '),
            formatBytes(limit),
          ),
        });
      }
    }
    const accepted = limit ? files.filter((f) => f.size <= limit) : files;
    if (!accepted.length) return;

    try {
      const parsed = await Promise.all(accepted.map(parseMusicFile));
      const parsedSingers = await Promise.all(
        parsed.map((item) => resolveArtistSingers(item.parsed.artist)),
      );
      const now = Date.now();
      const newTasks: ImportTask[] = accepted.map((file, i) => ({
        id: `import-${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        parsed: parsed[i].parsed,
        name: parsed[i].name,
        singers: parsedSingers[i],
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
