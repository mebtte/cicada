import Drawer from '#/components/drawer';
import { CSSProperties } from 'react';
import useDynamicZIndex from '../use_dynamic_z_index';
import useOpen from './use_open';
import { EventType as PlayerEventType } from '../eventemitter';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: '85%',
    maxWidth: 400,
  },
};

function PlaylistPlayqueueDrawer() {
  const zIndex = useDynamicZIndex(
    PlayerEventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER,
  );
  const { open, onClose } = useOpen();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      playlist playqueue
    </Drawer>
  );
}

export default PlaylistPlayqueueDrawer;
