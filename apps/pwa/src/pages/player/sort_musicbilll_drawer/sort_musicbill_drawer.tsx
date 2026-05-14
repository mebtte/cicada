import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components';
import { useCallback, useEffect, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import updateProfile from '@/server/api/update_profile';
import logger from '@/utils/logger';
import dialog from '@/utils/dialog';
import { IS_TOUCHABLE } from '@/constants/browser';
import { AllowUpdateKey } from '@/constants/user';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { reloadUser } from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import { Musicbill as MusicbillType } from '../constants';
import { LocalMusicbill } from './constant';
import Musicbill from './musicbill';

const Shell = styled.div`
  height: 100%;
  min-height: 0;

  display: flex;
  flex-direction: column;
`;
const Header = styled(DrawerHeader)`
  padding: 20px 18px 16px;

  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};
`;
const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const HeaderTitle = styled(DrawerTitle)`
  flex: 1;
  min-width: 0;
`;
const Content = styled.div`
  flex: 1;
  min-height: 0;
  padding: 16px 14px max(20px, env(safe-area-inset-bottom, 20px));

  overflow: auto;
  overscroll-behavior: contain;
  ${autoScrollbar}
`;
const MusicbillList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const drawerStyle = {
  width: 'min(340px, calc(100vw - 20px))',
};

const toLocalMusicbill = (musicbill: MusicbillType): LocalMusicbill => ({
  id: musicbill.id,
  cover: musicbill.cover,
  name: musicbill.name,
  public: musicbill.public,
});

function MusicbillOrderDrawer({
  open,
  onClose,
  musicbillList,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  musicbillList: MusicbillType[];
  zIndex: number;
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
      <DrawerContent
        side="right"
        style={drawerStyle}
        zIndex={zIndex}
      >
        <Shell>
          <Header>
            <HeaderRow>
              <HeaderTitle>{t('sort_musicbill')}</HeaderTitle>
            </HeaderRow>
          </Header>
          <Content>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={localMusicbillList.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <MusicbillList>
                  {localMusicbillList.map((musicbill) => (
                    <Musicbill
                      key={musicbill.id}
                      musicbill={musicbill}
                    />
                  ))}
                </MusicbillList>
              </SortableContext>
            </DndContext>
          </Content>
        </Shell>
      </DrawerContent>
    </Drawer>
  );
}

export default MusicbillOrderDrawer;
