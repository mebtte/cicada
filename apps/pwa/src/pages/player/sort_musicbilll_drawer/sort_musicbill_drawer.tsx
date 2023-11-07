import Drawer, { Title } from '@/components/drawer';
import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { SortableContainer } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import updateProfile from '@/server/api/update_profile';
import logger from '@/utils/logger';
import dialog from '@/utils/dialog';
import { IS_TOUCHABLE } from '@/constants/browser';
import { AllowUpdateKey } from '#/constants/user';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { reloadUser } from '@/global_states/server';
import { Musicbill as MusicbillType, ZIndex } from '../constants';
import { LocalMusicbill } from './constant';
import Musicbill from './musicbill';
import e, { EventType } from './eventemitter';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.DRAWER,
  },
};
const bodyProps: { style: CSSProperties } = {
  style: {
    width: 250,
  },
};
const Content = styled.div`
  height: 100%;
  padding-bottom: env(safe-area-inset-bottom, 0);

  overflow: auto;
  ${autoScrollbar}
`;
const toLocalMusicbill = (musicbill: MusicbillType): LocalMusicbill => ({
  id: musicbill.id,
  cover: musicbill.cover,
  name: musicbill.name,
  public: musicbill.public,
  shared: musicbill.sharedUserList.length > 0,
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

    return updateProfile({
      key: AllowUpdateKey.MUSICBILL_ORDERS,
      value: orderedMusicbillIdList,
    })
      .then(() => reloadUser())
      .catch((error) => {
        logger.error(error, 'Failed to update musicbill orders');
        dialog.alert({
          title: t('update_musicbill_order_error'),
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
      <Content>
        <Title>{t('sort_musicbill')}</Title>
        <MusicbillList
          musicbillList={localMusicbillList}
          updateBeforeSortStart={(s) =>
            e.emit(EventType.BEFORE_DRAG_START, { index: s.index })
          }
          onSortEnd={onSortEnd}
          pressDelay={IS_TOUCHABLE ? 250 : 0}
        />
      </Content>
    </Drawer>
  );
}

export default MusicbillOrderDrawer;
