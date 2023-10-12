import { memo, CSSProperties } from 'react';
import setting from '@/global_states/setting';
import { Select, Option } from '@/components/select';
import { LANGUAGE_MAP, t } from '@/i18n';
import { Language } from '#/constants';
import dialog from '@/utils/dialog';
import Item from './item';
import { itemStyle } from './constants';

const LANGUAGES = Object.values(Language);
const style: CSSProperties = {
  width: 200,
};
const options: Option<Language>[] = LANGUAGES.map((l) => ({
  label: LANGUAGE_MAP[l].label,
  value: l,
  actualValue: l,
}));

function Wrapper() {
  const { language } = setting.useState();
  return (
    <Item label={t('language')} style={itemStyle}>
      <Select<Language>
        value={{
          label: LANGUAGE_MAP[language].label,
          value: language,
          actualValue: language,
        }}
        onChange={(option) => {
          if (option.value !== language) {
            dialog.confirm({
              content: t('change_language_question'),
              onConfirm: () => {
                setting.set((prev) => ({
                  ...prev,
                  language: option.actualValue,
                }));
                window.setTimeout(() => window.location.reload(), 0);
              },
            });
          }
        }}
        options={options}
        style={style}
      />
    </Item>
  );
}

export default memo(Wrapper);
