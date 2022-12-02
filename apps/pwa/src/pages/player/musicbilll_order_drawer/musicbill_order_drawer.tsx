import Drawer from '#/components/drawer';
import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { SortableContainer } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import updateMusicbillOrder from '@/server/update_musicbill_order';
import logger from '#/utils/logger';
import dialog from '#/utils/dialog';
import { Musicbill as MusicbillType, ZIndex } from '../constants';
import { LocalMusicbill } from './constant';
import Musicbill from './musicbill';
import e, { EventType } from './eventemitter';
import Top from './top';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.DRAWER,
  },
};
const bodyProps: { style: CSSProperties } = {
  style: {
    width: 250,
    overflow: 'auto',
  },
};
const toLocalMusicbill = (musicbill: MusicbillType): LocalMusicbill => ({
  id: musicbill.id,
  cover: musicbill.cover,
  name: musicbill.name,
});
type MusicbillListProps = { musicbillList: LocalMusicbill[] };

const MusicbillList = SortableContainer<MusicbillListProps>(
  ({ musicbillList }: MusicbillListProps) => (
    <div>
      {musicbillList.map((musicbill, index) => (
        <Musicbill
          key={musicbill.id}
          index={index}
          selfIndex={index}
          musicbill={musicbill}
        />
      ))}
    </div>
  ),
);

function MusicbillOrderDrawer({
  open,
  onClose,
  musicbillList,
}: {
  open: boolean;
  onClose: () => void;
  musicbillList: MusicbillType[];
}) {
  const [localMusicbillList, setLocalMusicbillList] = useState(() =>
    musicbillList.map(toLocalMusicbill),
  );
  const onSortEnd = useCallback(
    ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
      e.emit(EventType.DRAG_END, null);
      return setLocalMusicbillList((lml) =>
        arrayMoveImmutable(lml, oldIndex, newIndex),
      );
    },
    [],
  );
  const onCloseWrapper = () => {
    onClose();

    const originalMusicbillIds = musicbillList.map((m) => m.id).join(',');
    const orderedMusicbillIdList = localMusicbillList.map((m) => m.id);
    const orderedMusicbillIds = orderedMusicbillIdList.join(',');

    if (originalMusicbillIds === orderedMusicbillIds) {
      return;
    }

    return updateMusicbillOrder(orderedMusicbillIdList)
      .then(() =>
        playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL_LIST, null),
      )
      .catch((error) => {
        logger.error(error, '更新乐单顺序失败');
        dialog.alert({
          title: '更新乐单顺序失败',
          content: error.message,
        });
      });
  };

  useEffect(() => {
    setLocalMusicbillList(musicbillList.map(toLocalMusicbill));
  }, [musicbillList]);

  return (
    <Drawer
      open={open}
      onClose={onCloseWrapper}
      maskProps={maskProps}
      bodyProps={bodyProps}
    >
      <Top />
      <MusicbillList
        musicbillList={localMusicbillList}
        updateBeforeSortStart={(s) =>
          e.emit(EventType.BEFORE_DRAG_START, { index: s.index })
        }
        onSortEnd={onSortEnd}
      />
    </Drawer>
  );
}

export default MusicbillOrderDrawer;
