import { memo, CSSProperties } from 'react';
import { Select, SelectOption } from '@/components_next';
import { LANGUAGE_MAP, t } from '@/i18n';
import { Language } from '#/constants';
import dialog from '@/utils/dialog';
import Item from './item';
import { itemStyle } from './constants';
import { useSetting } from '@/global_states/setting';

const LANGUAGES = Object.values(Language);
const style: CSSProperties = {
  width: 200,
};
const options: SelectOption<Language>[] = LANGUAGES.map((l) => ({
  label: LANGUAGE_MAP[l].label,
  value: l,
}));

function Wrapper() {
  const { language } = useSetting();
  return (
    <Item label={t('language')} style={itemStyle}>
      <Select<Language>
        value={language}
        onChange={(value) => {
          if (value !== language) {
            dialog.confirm({
              content: t('change_language_question'),
              onConfirm: () => {
                useSetting.setState({ language: value });
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
