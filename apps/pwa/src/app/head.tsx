import { t } from '@/i18n';
import capitalize from '#/utils/capitalize';
import upperCaseFirstLetter from '#/utils/upper_case_first_letter';
import { memo } from 'react';
import { Helmet } from 'react-helmet';
import { IS_IPAD, IS_IPHONE, IS_MAC_OS } from '@/constants/browser';

const MANIFEST_URL = URL.createObjectURL(
  new Blob(
    [
      JSON.stringify({
        name: capitalize(t('cicada')),
        short_name: capitalize(t('cicada')),
        description: upperCaseFirstLetter(t('cicada_description')),
        icons:
          IS_MAC_OS || IS_IPAD || IS_IPHONE
            ? [
                {
                  src: `${window.location.origin}/app_icon_macos_512.png`,
                  type: 'image/png',
                  sizes: '512x512',
                },
                {
                  src: `${window.location.origin}/app_icon_maskable_macos_512.png`,
                  type: 'image/png',
                  sizes: '512x512',
                  purpose: 'maskable',
                },
              ]
            : [
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
