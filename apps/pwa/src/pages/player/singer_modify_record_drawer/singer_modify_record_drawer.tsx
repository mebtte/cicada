import { Drawer, DrawerContent } from '@/components';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { Artist } from './constants';
import Content from './content';
import Hint from './hint';

const ContentWrapper = styled.div`
  height: 100%;

  overflow: auto;
  ${autoScrollbar}
`;

function ArtistModifyRecordDrawer({
  artist,
  open,
  onClose,
  zIndex,
}: {
  artist: Artist;
  open: boolean;
  onClose: () => void;
  zIndex: number;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 300 }} zIndex={zIndex}>
        <ContentWrapper>
          <Content artist={artist} />
          <Hint />
        </ContentWrapper>
      </DrawerContent>
    </Drawer>
  );
}

export default ArtistModifyRecordDrawer;
