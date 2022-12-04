import Drawer, { Direction } from '@/components/drawer';
import { CSSProperties, useEffect, useState } from 'react';
import Content from './content';
import e, { EventType } from '../eventemitter';
import { WIDTH } from './constants';
import { ZIndex } from '../constants';

const onClose = () => e.emit(EventType.MINI_MODE_CLOSE_SIDEBAR, null);
const maskProps: { style: CSSProperties } = {
  style: { zIndex: ZIndex.DRAWER },
};
const bodyProps: {
  style: CSSProperties;
} = {
  style: {
    width: WIDTH,
    overflow: 'auto',
  },
};

function MiniMode() {
  const [open, setOpen] = useState(false);

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

  return (
    <Drawer
      open={open}
      onClose={onClose}
      direction={Direction.LEFT}
      maskProps={maskProps}
      bodyProps={{
        ...bodyProps,
        onClick: onClose,
      }}
    >
      <Content />
    </Drawer>
  );
}

export default MiniMode;
