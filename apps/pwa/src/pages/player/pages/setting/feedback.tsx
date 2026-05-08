import Button from '@/components/button';
import { IconExternalLink } from '@/components/icon';
import { memo } from 'react';
import { t } from '@/i18n';
import { buttonItemStyle } from './constants';

function Feedback() {
  return (
    <Button
      variant={'ghost'}
      style={buttonItemStyle}
      icon={<IconExternalLink size={16} aria-hidden="true" />}
      onClick={() =>
        window.open(
          'https://github.com/mebtte/cicada/issues',
          '_blank',
          'noopener,noreferrer',
        )
      }
    >
      {t('feedback')}
    </Button>
  );
}

export default memo(Feedback);
