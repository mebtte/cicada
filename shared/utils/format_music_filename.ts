import sanitize from 'sanitize-filename';
import { t } from '../../apps/pwa/src/i18n';

function formatMusicFilename({
  name,
  singerNames,
  ext,
}: {
  name: string;
  singerNames: string[];
  ext: string;
}) {
  return sanitize(
    `${
      singerNames.length === 0
        ? t('unknown_singer')
        : singerNames.length > 3
        ? t('multiple_singers')
        : singerNames.join(',')
    } - ${name}.${ext}`,
  );
}

export default formatMusicFilename;
