import { Drawer, DrawerContent } from '@/components';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { Singer } from './constants';
import Content from './content';
import Hint from './hint';

const ContentWrapper = styled.div`
  height: 100%;

  overflow: auto;
  ${autoScrollbar}
`;

function SingerModifyRecordDrawer({
  singer,
  open,
  onClose,
}: {
  singer: Singer;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 300 }}>
        <ContentWrapper>
          <Content singer={singer} />
          <Hint />
        </ContentWrapper>
      </DrawerContent>
    </Drawer>
  );
}

export default SingerModifyRecordDrawer;
