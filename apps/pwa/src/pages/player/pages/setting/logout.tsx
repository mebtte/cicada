import Button, { Variant } from '#/components/button';
import useEvent from '#/utils/use_event';
import { CSSProperties, memo } from 'react';
import dialog from '#/utils/dialog';
import token from '@/global_states/token';
import { CacheName } from '@/constants/cache';
import logger from '#/utils/logger';
import setting from '@/global_states/setting';

const style: CSSProperties = {
  display: 'block',
  margin: '0 20px',
  width: 'calc(100% - 40px)',
};

function Logout() {
  const onLogout = useEvent(() =>
    dialog.confirm({
      title: '确定退出登录吗?',
      onConfirm: () => {
        token.set('');

        /**
         * 退出登录需要移除相关缓存
         * 以及重置部分设置
         * @author mebtte<hi@mebtte.com>
         */
        window.caches
          .delete(CacheName.API)
          .catch((error) => logger.error(error, '退出登录移除 API cache 失败'));
        setting.set((s) => ({
          ...s,
          playerVolume: 1,
        }));
      },
    }),
  );
  return (
    <Button variant={Variant.DANGER} style={style} onClick={onLogout}>
      退出登录
    </Button>
  );
}

export default memo(Logout);
