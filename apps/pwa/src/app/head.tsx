import { t } from '@/i18n';
import upperCaseFirstLetter from '#/utils/capitalize';
import { memo } from 'react';
import { Helmet } from 'react-helmet';

const MANIFEST_URL = URL.createObjectURL(
  new Blob(
    [
      JSON.stringify({
        name: upperCaseFirstLetter(t('cicada')),
        short_name: upperCaseFirstLetter(t('cicada')),
        description: upperCaseFirstLetter(t('cicada_description')),
        icons: [
          {
            src: `${window.location.origin}/app_icon_512.png`,
            type: 'image/png',
            sizes: '512x512',
          },
          {
            src: `${window.location.origin}/app_icon_maskable_512.png`,
            type: 'image/png',
            sizes: '512x512',
            purpose: 'maskable',
          },
        ],
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
    <Helmet>
      <title>{upperCaseFirstLetter(t('cicada'))}</title>
      <meta
        name="description"
        content={upperCaseFirstLetter(t('cicada_description'))}
      />
      <link rel="manifest" href={MANIFEST_URL} />
    </Helmet>
  );
}

export default memo(Head);
