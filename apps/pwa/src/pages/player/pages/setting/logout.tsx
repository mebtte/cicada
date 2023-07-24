import Button, { Variant } from '@/components/button';
import useEvent from '@/utils/use_event';
import { CSSProperties, memo } from 'react';
import dialog from '@/utils/dialog';
import token from '@/global_states/token';
import { CacheName } from '@/constants/cache';
import logger from '@/utils/logger';
import setting from '@/global_states/setting';
import { t } from '@/i18n';
import { itemStyle } from './constants';

const style: CSSProperties = {
  ...itemStyle,
  display: 'block',
  width: 'calc(100% - 40px)',
};

function Logout() {
  const onLogout = useEvent(() =>
    dialog.confirm({
      title: t('logout_question'),
      onConfirm: () => {
        token.set('');

        /**
         * 退出登录需要移除相关缓存
         * 以及重置部分设置
         * @author mebtte<hi@mebtte.com>
         */
        if (window.caches) {
          window.caches
            .delete(CacheName.API)
            .catch((error) => logger.error(error, 'Failed to remove cache'));
        }
        setting.set((s) => ({
          ...s,
          playerVolume: 1,
        }));
      },
    }),
  );
  return (
    <Button variant={Variant.DANGER} style={style} onClick={onLogout}>
      {t('logout')}
    </Button>
  );
}

export default memo(Logout);
