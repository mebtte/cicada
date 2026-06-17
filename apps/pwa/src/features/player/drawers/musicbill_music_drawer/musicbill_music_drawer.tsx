import { memo } from 'react';
import { Drawer, DrawerContent } from '@/components';
import Button from '@/components/button';
import { AddBox } from '@/components/icon';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { MusicWithArtistAliases } from '../../constants';
import { t } from '@/i18n';
import { openCreateMusicbillDialog } from '../../utils';
import Top from './top';
import MusicbillList from './musicbill_list';

const Content = styled.div`
  position: relative;
  height: 100%;

  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
const ScrollContent = styled.div`
  flex: 1;
  min-height: 0;

  overflow: auto;
  ${autoScrollbar}
`;
const FloatingCreateButton = styled(Button)`
  position: absolute;
  right: 16px;
  bottom: max(env(safe-area-inset-bottom, 0) + 16px, 16px);
  z-index: 2;
`;

function MusicbillMusicDrawer({
  open,
  onClose,
  music,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  music: MusicWithArtistAliases;
  zIndex: number;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 300 }}
        zIndex={zIndex}
        accessibleTitle={t('add_to_musicbill')}
      >
        <Content>
          <ScrollContent>
            <Top music={music} />
            <MusicbillList music={music} />
          </ScrollContent>
          <FloatingCreateButton
            square
            variant="primary"
            size="md"
            aria-label={t('create_musicbill')}
            onClick={openCreateMusicbillDialog}
          >
            <AddBox />
          </FloatingCreateButton>
        </Content>
      </DrawerContent>
    </Drawer>
  );
}

export default memo(MusicbillMusicDrawer);
