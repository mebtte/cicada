import { memo, CSSProperties } from 'react';
import { t } from '@/i18n';
import Item from './item';
import { itemStyle } from './constants';
import LanguageSelect from '@/components/language_select';

const style: CSSProperties = {
  width: 200,
};

function Wrapper() {
  return (
    <Item label={t('language')} style={itemStyle}>
      <LanguageSelect
        confirmBeforeReload
        style={style}
      />
    </Item>
  );
}

export default memo(Wrapper);
