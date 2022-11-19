import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdRefresh, MdPlaylistAdd, MdDelete, MdEdit } from 'react-icons/md';
import { RequestStatus } from '@/constants';
import dialog from '#/utils/dialog';
import deleteMusicbill from '@/server/delete_musicbill';
import useNavigate from '#/utils/use_navigate';
import logger from '#/utils/logger';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import notice from '#/utils/notice';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Musicbill } from '../../constants';
import e, { EventType } from './eventemitter';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

function Operation({ musicbill }: { musicbill: Musicbill }) {
  const navigate = useNavigate();
  const { status, musicList } = musicbill;
  return (
    <Style>
      <IconButton
        disabled={status !== RequestStatus.SUCCESS}
        onClick={() =>
          musicList.length
            ? playerEventemitter.emit(
                PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
                {
                  musicList,
                },
              )
            : notice.error('乐单暂无音乐')
        }
      >
        <MdPlaylistAdd />
      </IconButton>
      <IconButton
        loading={status === RequestStatus.LOADING}
        disabled={status !== RequestStatus.SUCCESS}
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
            id: musicbill.id,
          })
        }
      >
        <MdRefresh />
      </IconButton>
      <IconButton onClick={() => e.emit(EventType.OPEN_EDIT_MENU, null)}>
        <MdEdit />
      </IconButton>
      <IconButton
        onClick={() =>
          dialog.confirm({
            title: `确定删除乐单?`,
            content: '注意, 乐单删除后无法恢复',
            onConfirm: () =>
              void dialog.confirm({
                title: '确定删除乐单?',
                content: '现在是第二次确认, 也是最后一次',
                onConfirm: async () => {
                  try {
                    await deleteMusicbill(musicbill.id);
                    playerEventemitter.emit(
                      PlayerEventType.RELOAD_MUSICBILL_LIST,
                      null,
                    );
                    navigate({ path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORE });
                  } catch (error) {
                    logger.error(error, '删除乐单失败');
                    dialog.alert({
                      title: '删除乐单失败',
                      content: error.message,
                    });
                  }
                },
              }),
          })
        }
      >
        <MdDelete />
      </IconButton>
    </Style>
  );
}

export default Operation;
