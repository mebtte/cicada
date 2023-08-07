import { CSSProperties, memo } from 'react';
import Drawer from '@/components/drawer';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { EventType } from '../eventemitter';
import { MusicWithSingerAliases } from '../constants';
import useDynamicZIndex from '../use_dynamic_z_index';
import Top from './top';
import MusicbillList from './musicbill_list';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 300,
  },
};
const Content = styled.div`
  height: 100%;

  overflow: auto;
  ${autoScrollbar}
`;

function MusicbillMusicDrawer({
  open,
  onClose,
  music,
}: {
  open: boolean;
  onClose: () => void;
  music: MusicWithSingerAliases;
}) {
  const zIndex = useDynamicZIndex(EventType.OPEN_MUSICBILL_MUSIC_DRAWER);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      <Content>
        <Top music={music} />
        <MusicbillList music={music} />
      </Content>
    </Drawer>
  );
}

export default memo(MusicbillMusicDrawer);
