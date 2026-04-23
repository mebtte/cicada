import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components_next';
import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import updateProfile from '@/server/api/update_profile';
import logger from '@/utils/logger';
import dialog from '@/utils/dialog';
import { IS_TOUCHABLE } from '@/constants/browser';
import { AllowUpdateKey } from '#/constants/user';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { reloadUser } from '@/global_states/server';
import { Musicbill as MusicbillType } from '../constants';
import { LocalMusicbill } from './constant';
import Musicbill from './musicbill';

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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: IS_TOUCHABLE ? 250 : 0, tolerance: 5 },
    }),
  );
  const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      setLocalMusicbillList((lml) => {
        const oldIndex = lml.findIndex((m) => m.id === active.id);
        const newIndex = lml.findIndex((m) => m.id === over.id);
        return arrayMove(lml, oldIndex, newIndex);
      });
    }
  }, []);
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
    <Drawer open={open} onOpenChange={(v) => !v && onCloseWrapper()}>
      <DrawerContent side="right" style={{ width: 250 }}>
        <DrawerHeader>
          <DrawerTitle>{t('sort_musicbill')}</DrawerTitle>
        </DrawerHeader>
        <Content>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext
              items={localMusicbillList.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {localMusicbillList.map((musicbill) => (
                  <Musicbill key={musicbill.id} musicbill={musicbill} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </Content>
      </DrawerContent>
    </Drawer>
  );
}

export default MusicbillOrderDrawer;
