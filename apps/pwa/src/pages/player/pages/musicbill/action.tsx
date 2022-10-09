import styled from 'styled-components';
import notice from '#/utils/notice';
import { RequestStatus } from '@/constants';
import dialog from '#/utils/dialog';
import logger from '#/utils/logger';
import deleteMusicbill from '@/server/delete_musicbill';
import Tooltip, { Placement } from '#/components/tooltip';
import IconButton, { Name } from '@/components/icon_button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useNavigate from '#/utils/use_navigate';
import eventemitter, { EventType } from './eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { TopContent } from './constants';
import { Musicbill } from '../../constants';

const ACTION_SIZE = 28;
const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 20px;
  gap: 10px;
  padding: 10px 0;
`;
const onSearch = () =>
  eventemitter.emit(EventType.TOP_CONTENT_CHANGE, {
    topContent: TopContent.SEARCH,
  });
const openTextEditDialog = () =>
  eventemitter.emit(EventType.OPEN_EDIT_DIALOG, null);

function Action({ musicbill }: { musicbill: Musicbill }) {
  const navigate = useNavigate();

  const onAddToPlaylist = () => {
    const { musicList } = musicbill;
    return playerEventemitter.emit(
      PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      { musicList: musicList.map((m) => m.music) },
    );
  };
  const onCopyID = () =>
    window.navigator.clipboard
      .writeText(musicbill.id)
      .then(() => notice.success(`已复制「${musicbill.id}」`))
      .catch((error) =>
        dialog.alert({
          title: '复制失败',
          content: error.message,
        }),
      );
  const onDelete = () =>
    dialog.confirm({
      title: `确定删除乐单"${musicbill.name}"?`,
      content: '注意, 乐单删除后无法恢复.',
      onConfirm: () =>
        dialog.confirm({
          title: `确定删除乐单"${musicbill.name}"?`,
          content:
            '注意, 乐单删除后无法恢复. 现在是第二次确认, 也是最后一次确认.',
          onConfirm: async () => {
            try {
              await deleteMusicbill(musicbill.id);
              playerEventemitter.emit(
                PlayerEventType.RELOAD_MUSICBILL_LIST,
                null,
              );
              navigate({ path: ROOT_PATH.PLAYER + PLAYER_PATH.HOME });
            } catch (error) {
              logger.error(error, '删除乐单失败');
              dialog.alert({
                title: '删除乐单失败',
                content: error.message,
              });
              return false;
            }
          },
        }),
    });

  const { status } = musicbill;
  return (
    <Style>
      <Tooltip title="重新加载" placement={Placement.LEFT}>
        <IconButton
          name={Name.REFRESH_OUTLINE}
          size={ACTION_SIZE}
          loading={status === RequestStatus.LOADING}
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
              id: musicbill.id,
            })
          }
        />
      </Tooltip>
      <Tooltip title="全部添加到播放列表" placement={Placement.LEFT}>
        <IconButton
          name={Name.PLUS_OUTLINE}
          size={ACTION_SIZE}
          onClick={onAddToPlaylist}
          disabled={
            status !== RequestStatus.SUCCESS || !musicbill.musicList.length
          }
        />
      </Tooltip>
      <Tooltip title="乐单内查找" placement={Placement.LEFT}>
        <IconButton
          onClick={onSearch}
          size={ACTION_SIZE}
          name={Name.SEARCH_LIST_OUTLINE}
        />
      </Tooltip>
      <Tooltip title="更新乐单信息" placement={Placement.LEFT}>
        <IconButton
          name={Name.EDIT_OUTLINE}
          size={ACTION_SIZE}
          onClick={openTextEditDialog}
        />
      </Tooltip>
      <Tooltip title="复制乐单 ID" placement={Placement.LEFT}>
        <IconButton
          name={Name.COPY_OUTLINE}
          size={ACTION_SIZE}
          onClick={onCopyID}
        />
      </Tooltip>
      <Tooltip title="删除乐单" placement={Placement.LEFT}>
        <IconButton
          name={Name.GARBAGE_OUTLINE}
          size={ACTION_SIZE}
          onClick={onDelete}
        />
      </Tooltip>
    </Style>
  );
}

export default Action;
