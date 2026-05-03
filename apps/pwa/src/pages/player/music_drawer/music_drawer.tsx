import { Drawer, DrawerContent } from '@/components';
import MusicContent from './content';

function MusicDrawer({
  id,
  open,
  onClose,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 'min(350px, 85%)' }}>
        <MusicContent id={id} />
      </DrawerContent>
    </Drawer>
  );
}

export default MusicDrawer;
