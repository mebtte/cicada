import { memo } from 'react';
import useOpen from './use_open';
import MusicDrawer from './music_drawer';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

function Wrapper() {
  const { open, onClose, id, miniMode } = useOpen();
  const zIndex = useDynamicZIndex(EventType.OPEN_MUSIC_DRAWER);
  if (id && !miniMode) {
    return (
      <MusicDrawer open={open} onClose={onClose} id={id} zIndex={zIndex} />
    );
  }
  return null;
}

export default memo(Wrapper);
