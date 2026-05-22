import sanitize from 'sanitize-filename';
import { t } from '@/i18n';

function formatMusicFilename({
  name,
  singerNames,
  ext,
  index,
  tag,
}: {
  name: string;
  singerNames: string[];
  ext: string;
  // 多文件场景下用于追加 (1)/(2)/... 后缀; 单文件不传
  index?: number;
  // 可选的码率/编码标签, 比如 "192k.AAC", 会以点分隔插在文件名与扩展名之间
  tag?: string;
}) {
  return sanitize(
    `${
      singerNames.length === 0
        ? t('unknown_singer')
        : singerNames.length > 3
        ? t('multiple_singers')
        : singerNames.join(',')
    } - ${name}${index === undefined ? '' : `(${index})`}${
      tag ? `.${tag}` : ''
    }.${ext}`,
  );
}

export default formatMusicFilename;
