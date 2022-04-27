import React, { useState, useEffect, useContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styled, { css } from 'styled-components';

import Drawer, { Title } from '@/components/drawer';
import updateMusicbillOrder from '@/server/update_musicbill_order';
import logger from '@/platform/logger';
import dialog from '@/platform/dialog';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import eventemitter, { EventType } from '../eventemitter';
import { Musicbill as MusicbillType } from './constant';
import Context from '../context';
import Musicbill from './musicbill';

const bodyProps = {
  style: {
    width: 350,
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
};
const List = styled.div<{ topBoxShadow: boolean }>`
  flex: 1;
  min-height: 0;

  padding-bottom: 10px;

  overflow: auto;
  ${scrollbarAsNeeded}

  ${({ topBoxShadow }) => css`
    box-shadow: ${topBoxShadow
      ? 'inset 0px 5px 5px -5px rgb(0 0 0 / 15%)'
      : 'none'};
  `}
`;

const MusicbillOrderDrawer = () => {
  const { musicbillList } = useContext(Context);

  const [localMusicbillList, setLocalMusicbillList] = useState<MusicbillType[]>(
    [],
  );

  const [open, setOpen] = useState(false);
  const onClose = () => {
    setOpen(false);

    const originaMusicbillIds = musicbillList.map((m) => m.id).join(',');
    const orderedMusicbillIdList = localMusicbillList.map((m) => m.id);
    const orderedMusicbillIds = orderedMusicbillIdList.join(',');

    if (originaMusicbillIds === orderedMusicbillIds) {
      return;
    }

    return updateMusicbillOrder(orderedMusicbillIdList)
      .then(() => eventemitter.emit(EventType.RELOAD_MUSICBILL_LIST))
      .catch((error) => {
        logger.error(error, {
          description: '更新歌单顺序失败',
          report: true,
        });
        dialog.alert({
          title: '更新歌单顺序失败',
          content: error.message,
        });
      });
  };

  const move = (dragIndex: number, hoverIndex: number) =>
    setLocalMusicbillList((lmbl) => {
      const newMusicbillList = [...lmbl];
      const [dragMusicbill] = newMusicbillList.splice(dragIndex, 1);
      newMusicbillList.splice(hoverIndex, 0, dragMusicbill);
      return newMusicbillList;
    });

  const [topBoxShadow, setTopBoxShadow] = useState(false);
  const onListScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    return setTopBoxShadow(scrollTop !== 0);
  };

  useEffect(() => {
    const openListener = () => {
      setLocalMusicbillList(
        musicbillList.map((m) => ({
          id: m.id,
          cover: m.cover,
          name: m.name,
        })),
      );
      return setOpen(true);
    };
    eventemitter.on(EventType.OPEN_MUSICBILL_ORDER_DRAWER, openListener);
    return () =>
      void eventemitter.off(
        EventType.OPEN_MUSICBILL_ORDER_DRAWER,
        openListener,
      );
  }, [musicbillList]);

  return (
    <Drawer open={open} onClose={onClose} bodyProps={bodyProps}>
      <Title>排序歌单</Title>
      <DndProvider backend={HTML5Backend}>
        <List onScroll={onListScroll} topBoxShadow={topBoxShadow}>
          {localMusicbillList.map((mb, index) => (
            <Musicbill key={mb.id} index={index} musicbill={mb} move={move} />
          ))}
        </List>
      </DndProvider>
    </Drawer>
  );
};

export default React.memo(MusicbillOrderDrawer);
