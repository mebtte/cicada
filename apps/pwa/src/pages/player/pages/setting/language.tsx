import { memo, CSSProperties } from 'react';
import setting from '@/global_states/setting';
import Select from '@/components/select';
import { LANGUAGE_MAP, t } from '@/i18n';
import { Language } from '#/constants';
import dialog from '@/utils/dialog';
import Item from './item';
import { itemStyle } from './constants';

const LANGUAGES = Object.values(Language);
const style: CSSProperties = {
  width: 200,
};

function Wrapper() {
  const { language } = setting.useState();
  return (
    <Item label={t('language')} style={itemStyle}>
      <Select<Language>
        label=""
        value={{
          key: language,
          label: LANGUAGE_MAP[language].label,
          value: language,
        }}
        onChange={(v) => {
          if (v.value !== language) {
            dialog.confirm({
              content: t('change_language_question'),
              onConfirm: () => {
                setting.set((prev) => ({
                  ...prev,
                  language: v.value,
                }));
                window.setTimeout(() => window.location.reload(), 0);
              },
            });
          }
        }}
        data={LANGUAGES.map((l) => ({
          key: l,
          label: LANGUAGE_MAP[l].label,
          value: l,
        }))}
        style={style}
      />
    </Item>
  );
}

export default memo(Wrapper);
