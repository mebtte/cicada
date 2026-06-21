import { t } from '@/i18n';
import {
  formatMusicFilenamePerformerPrefix,
  sanitizeMusicFilename,
} from './music_filename';

function formatMusicFilename({
  name,
  performerNames,
  ext,
  index,
  tag,
}: {
  name: string;
  performerNames: string[];
  ext: string;
  // 多文件场景下用于追加 (1)/(2)/... 后缀; 单文件不传
  index?: number;
  // 可选的码率/编码标签, 比如 "192k.AAC", 会以点分隔插在文件名与扩展名之间
  tag?: string;
}) {
  return sanitizeMusicFilename(
    `${formatMusicFilenamePerformerPrefix(
      performerNames,
      t('unknown_artist'),
    )} - ${name}${index === undefined ? '' : `(${index})`}${
      tag ? `.${tag}` : ''
    }.${ext}`,
  );
}

export default formatMusicFilename;
