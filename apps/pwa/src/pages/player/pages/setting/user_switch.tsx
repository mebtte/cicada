import Button, { Variant } from '@/components/button';
import { t } from '@/i18n';
import { CSSProperties, useContext } from 'react';
import dialog from '@/utils/dialog';
import useNavigate from '@/utils/use_navigate';
import { ROOT_PATH } from '@/constants/route';
import context from '../../context';
import { itemStyle } from './constants';
import { clearApiCache } from './utils';

const style: CSSProperties = {
  ...itemStyle,
  display: 'block',
  width: 'calc(100% - 40px)',
};

function UserSwitch() {
  const navigate = useNavigate();
  const { playqueue, currentPlayqueuePosition } = useContext(context);
  const queueMusic = playqueue[currentPlayqueuePosition];
  const toLogin = () => {
    clearApiCache();
    return navigate({ path: ROOT_PATH.LOGIN });
  };

  return (
    <Button
      variant={Variant.PRIMARY}
      style={style}
      onClick={() =>
        queueMusic
          ? dialog.confirm({
              content: t('switch_user_question'),
              onConfirm: toLogin,
            })
          : toLogin()
      }
    >
      {t('switch_user')}
    </Button>
  );
}

export default UserSwitch;
