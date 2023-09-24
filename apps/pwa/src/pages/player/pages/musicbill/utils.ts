import dialog from '@/utils/dialog';
import deleteMusicbillSharedUser from '@/server/api/delete_musicbill_shared_user';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import server, {
  getSelectedServer,
  getSelectedUser,
} from '@/global_states/server';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

export function quitSharedMusicbill({
  musicbillId,
  afterQuitted,
}: {
  musicbillId;
  afterQuitted;
}) {
  const selectedServer = getSelectedServer(server.get())!;
  const user = getSelectedUser(selectedServer)!;
  return dialog.confirm({
    title: '确定退出共享乐单吗?',
    onConfirm: async () => {
      try {
        await deleteMusicbillSharedUser({
          musicbillId,
          userId: user.id,
        });
        playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL_LIST, {
          silence: true,
        });
        afterQuitted();
      } catch (error) {
        logger.error(error, '退出共享乐单失败');
        notice.error(error.message);
        return false;
      }
    },
  });
}
