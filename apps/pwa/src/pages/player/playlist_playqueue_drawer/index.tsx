import { Drawer, DrawerContent } from '@/components';
import useOpen from './use_open';
import Content from './content';

function PlaylistPlayqueueDrawer() {
  const { open, onClose } = useOpen();

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 'min(400px, 85%)' }}>
        <Content />
      </DrawerContent>
    </Drawer>
  );
}

export default PlaylistPlayqueueDrawer;
