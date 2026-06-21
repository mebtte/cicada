import sanitize from 'sanitize-filename';

const MAX_FILENAME_PERFORMERS = 3;
const FILENAME_ILLEGAL_CHARACTER_REPLACEMENT = '_';

export function formatMusicFilenamePerformerPrefix(performerNames: string[]) {
  if (performerNames.length === 0) {
    return '';
  }

  // 文件名里只保留前三位歌手; 超出时追加 "...", 与 CLI 导出规则保持一致.
  const visiblePerformerNames =
    performerNames.length > MAX_FILENAME_PERFORMERS
      ? [...performerNames.slice(0, MAX_FILENAME_PERFORMERS), '...']
      : performerNames;
  return visiblePerformerNames.join(',');
}

export function sanitizeMusicFilename(filename: string) {
  return sanitize(filename, {
    replacement: FILENAME_ILLEGAL_CHARACTER_REPLACEMENT,
  });
}
