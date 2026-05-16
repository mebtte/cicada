import { Drawer, DrawerContent } from '@/components';
import useOpen from './use_open';
import Content from './content';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

function PlaylistPlayqueueDrawer() {
  const { open, onClose } = useOpen();
  const zIndex = useDynamicZIndex(EventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 'min(400px, 85%)' }} zIndex={zIndex}>
        <Content />
      </DrawerContent>
    </Drawer>
  );
}

export default PlaylistPlayqueueDrawer;
