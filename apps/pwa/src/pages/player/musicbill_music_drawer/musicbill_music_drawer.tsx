import { memo } from 'react';
import { Drawer, DrawerContent } from '@/components';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { MusicWithSingerAliases } from '../constants';
import Top from './top';
import MusicbillList from './musicbill_list';

const Content = styled.div`
  height: 100%;

  overflow: auto;
  ${autoScrollbar}
`;

function MusicbillMusicDrawer({
  open,
  onClose,
  music,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  music: MusicWithSingerAliases;
  zIndex: number;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 300 }} zIndex={zIndex}>
        <Content>
          <Top music={music} />
          <MusicbillList music={music} />
        </Content>
      </DrawerContent>
    </Drawer>
  );
}

export default memo(MusicbillMusicDrawer);
