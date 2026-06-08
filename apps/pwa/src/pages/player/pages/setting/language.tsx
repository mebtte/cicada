import { memo, CSSProperties } from 'react';
import { t } from '@/i18n';
import Item from './item';
import { itemStyle } from './constants';
import LanguageSelect from '@/features/language/language_select';
import { useTheme } from '@/global_states/theme';

const style: CSSProperties = {
  width: 280,
};
const miniModeStyle: CSSProperties = {
  ...style,
  width: '100%',
};

function Wrapper() {
  return (
    <Item label={t('language')} style={itemStyle}>
      <LanguageSelect
        confirmBeforeReload
        style={useTheme().miniMode ? miniModeStyle : style}
      />
    </Item>
  );
}

export default memo(Wrapper);
