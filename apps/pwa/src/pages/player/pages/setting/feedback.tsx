import Button, { Variant } from '@/components/button';
import { memo } from 'react';
import { t } from '@/i18n';
import { buttonItemStyle } from './constants';

function Feedback() {
  return (
    <Button
      variant={Variant.NORMAL}
      style={buttonItemStyle}
      onClick={() => window.open('https://github.com/mebtte/cicada/issues')}
    >
      {t('feedback')}
    </Button>
  );
}

export default memo(Feedback);
