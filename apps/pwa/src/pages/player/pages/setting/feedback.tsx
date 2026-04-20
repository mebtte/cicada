import Button from '@/components_next/button';
import { memo } from 'react';
import { t } from '@/i18n';
import { buttonItemStyle } from './constants';

function Feedback() {
  return (
    <Button
      variant={'ghost'}
      style={buttonItemStyle}
      onClick={() => window.open('https://github.com/mebtte/cicada/issues')}
    >
      {t('feedback')}
    </Button>
  );
}

export default memo(Feedback);
