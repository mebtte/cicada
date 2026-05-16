import { Drawer, DrawerContent } from '@/components';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import Content from './content';
import e, { EventType } from '../eventemitter';
import { WIDTH } from './constants';

const onClose = () => e.emit(EventType.MINI_MODE_CLOSE_SIDEBAR, null);
const ContentWrapper = styled.div`
  height: 100%;

  background: #fff;
  overflow: auto;
  ${autoScrollbar}
`;

function MiniMode() {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.MINI_MODE_OPEN_SIDEBAR, () =>
      setOpen(true),
    );
    const unlistenClose = e.listen(EventType.MINI_MODE_CLOSE_SIDEBAR, () =>
      setOpen(false),
    );
    return () => {
      unlistenOpen();
      unlistenClose();
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="left" showClose={false} style={{ width: WIDTH }}>
        <ContentWrapper onClick={onClose}>
          <Content />
        </ContentWrapper>
      </DrawerContent>
    </Drawer>
  );
}

export default MiniMode;
