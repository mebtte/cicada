import Button, { Variant } from '@/components/button';
import useEvent from '@/utils/use_event';
import { CSSProperties, memo } from 'react';
import dialog from '@/utils/dialog';
import { CacheName } from '@/constants/cache';
import logger from '@/utils/logger';
import { t } from '@/i18n';
import server, { getSelectedServer } from '@/global_states/server';
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
        const selectedServer = getSelectedServer(server.get());
        if (selectedServer) {
          server.set((ss) => ({
            ...ss,
            serverList: ss.serverList.map((s) =>
              s.origin === selectedServer.origin
                ? {
                    ...selectedServer,
                    users: s.users.filter((u) => u.id !== s.selectedUserId),
                    selectedUserId: undefined,
                  }
                : s,
            ),
          }));
        }

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
