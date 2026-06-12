import { useCallback } from 'react';
import { AssetType } from '@/constants/asset';
import { MusicType } from '@/constants/music';
import {
  addTasks,
  ImportTask,
  ImportTaskPerformer,
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

function performerMatchesName(performer: SearchArtistItem, name: string) {
  const normalizedName = normalizeArtistName(name);
  return (
    normalizeArtistName(performer.name) === normalizedName ||
    performer.aliases.some((alias) => normalizeArtistName(alias) === normalizedName)
  );
}

const performerCache = new Map<string, Promise<ImportTaskPerformer | undefined>>();

function findExactPerformer(name: string): Promise<ImportTaskPerformer | undefined> {
  const normalizedName = normalizeArtistName(name);
  if (!normalizedName) return Promise.resolve(undefined);

  const cached = performerCache.get(normalizedName);
  if (cached) return cached;

  const request = searchArtistRequest({
    keyword: name,
    page: 1,
    pageSize: 20,
    requestMinimalDuration: 0,
  }).then(({ artistList }) => {
    const matched = artistList.find((performer) => performerMatchesName(performer, name));
    return matched ? { id: matched.id, name: matched.name } : undefined;
  });
  performerCache.set(normalizedName, request);
  return request;
}

async function resolveArtistPerformers(artist?: string): Promise<ImportTaskPerformer[]> {
  const trimmedArtist = artist?.trim();
  if (!trimmedArtist) return [];

  try {
    // Prefer an exact whole-artist match so names like "AC/DC" are not split
    // into unrelated performers when that artist already exists.
    const wholeMatch = await findExactPerformer(trimmedArtist);
    if (wholeMatch) return [wholeMatch];

    const performers = await Promise.all(
      splitArtistNames(trimmedArtist).map(findExactPerformer),
    );
    const deduped = new Map<string, ImportTaskPerformer>();
    performers.forEach((performer) => {
      if (performer) {
        deduped.set(performer.id, performer);
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

    const oversize = files.filter((f) => {
      const limit = getAssetMaxSize(AssetType.MUSIC, f.type);
      return limit != null && f.size > limit;
    });
    if (oversize.length) {
      dialog.alert({
        content: t(
          'asset_oversize_warning',
          oversize.map((f) => f.name).join(', '),
          formatBytes(
            getAssetMaxSize(AssetType.MUSIC, oversize[0].type) ?? 0,
          ),
        ),
      });
    }
    const accepted = files.filter((f) => {
      const limit = getAssetMaxSize(AssetType.MUSIC, f.type);
      return limit == null || f.size <= limit;
    });
    if (!accepted.length) return;

    try {
      const parsed = await Promise.all(accepted.map(parseMusicFile));
      const parsedPerformers = await Promise.all(
        parsed.map((item) => resolveArtistPerformers(item.parsed.artist)),
      );
      const now = Date.now();
      const newTasks: ImportTask[] = accepted.map((file, i) => ({
        id: `import-${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        parsed: parsed[i].parsed,
        name: parsed[i].name,
        performers: parsedPerformers[i],
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
