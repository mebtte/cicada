import sanitize from 'sanitize-filename';
import { t } from '@/i18n';

function formatMusicFilename({
  name,
  singerNames,
  ext,
  index,
}: {
  name: string;
  singerNames: string[];
  ext: string;
  // 多文件场景下用于追加 (1)/(2)/... 后缀; 单文件不传
  index?: number;
}) {
  return sanitize(
    `${
      singerNames.length === 0
        ? t('unknown_singer')
        : singerNames.length > 3
        ? t('multiple_singers')
        : singerNames.join(',')
    } - ${name}${index === undefined ? '' : `(${index})`}.${ext}`,
  );
}

export default formatMusicFilename;
