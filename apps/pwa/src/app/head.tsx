import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import { memo } from 'react';
import storage, { Key } from '@/storage';
import { APP_BASE_URL, resolveAppURL } from '@/constants/app';

const appName =
  (await storage.getItem(Key.CUSTOM_APP_NAME)) || capitalize(t('cicada'));
// Chrome 触发 PWA 安装按钮要求 manifest 至少包含一个 ≥192x192 的图标
const FAVICON_SIZES = [16, 32, 48, 64, 96, 128, 192, 256, 512] as const;
const icons = FAVICON_SIZES.map((size) => ({
  src: resolveAppURL(`favicon-${size}_v1.png`),
  type: 'image/png',
  sizes: `${size}x${size}`,
}));
const MANIFEST_URL = URL.createObjectURL(
  new Blob(
    [
      JSON.stringify({
        name: appName,
        description: upperCaseFirstLetter(t('cicada_description')),
        icons,
        id: APP_BASE_URL,
        start_url: APP_BASE_URL,
        scope: APP_BASE_URL,
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        theme_color: '#ffffff',
      }),
    ],
    { type: 'application/json' },
  ),
);

function Head() {
  return (
    <>
      <title>{upperCaseFirstLetter(t('cicada'))}</title>
      <meta
        name="description"
        content={upperCaseFirstLetter(t('cicada_description'))}
      />
      <link rel="manifest" href={MANIFEST_URL} />
    </>
  );
}

export default memo(Head);
