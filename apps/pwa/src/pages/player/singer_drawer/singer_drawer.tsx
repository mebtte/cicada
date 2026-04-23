import { Drawer, DrawerContent } from '@/components_next';
import SingerContent from './content';

function SingerDrawer({
  open,
  onClose,
  id,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 'min(85%, 400px)' }}>
        <SingerContent id={id} />
      </DrawerContent>
    </Drawer>
  );
}

export default SingerDrawer;
