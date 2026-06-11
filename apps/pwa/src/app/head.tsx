import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import { memo } from 'react';
import storage, { Key } from '@/storage';

const appName =
  (await storage.getItem(Key.CUSTOM_APP_NAME)) || capitalize(t('cicada'));
const FAVICON_SIZES = [16, 32, 48, 64, 96, 128] as const;
const icons = FAVICON_SIZES.map((size) => ({
  src: `${window.location.origin}/favicon-${size}.png`,
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
        start_url: window.location.origin,
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
