import Button, { Variant } from '@/components/button';
import useEvent from '@/utils/use_event';
import { memo } from 'react';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import server, { getSelectedServer } from '@/global_states/server';
import useNavigate from '@/utils/use_navigate';
import { ROOT_PATH } from '@/constants/route';
import { clearApiCache } from './utils';
import { buttonItemStyle } from './constants';

function Logout() {
  const navigate = useNavigate();
  const onLogout = useEvent(() =>
    dialog.confirm({
      content: t('logout_question'),
      onConfirm: () => {
        navigate({ replace: true, path: ROOT_PATH.LOGIN });
        clearApiCache();
        return void window.setTimeout(() => {
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
        }, 0);
      },
    }),
  );
  return (
    <Button variant={Variant.DANGER} style={buttonItemStyle} onClick={onLogout}>
      {t('logout')}
    </Button>
  );
}

export default memo(Logout);
