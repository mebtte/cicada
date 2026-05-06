import { Drawer, DrawerContent } from '@/components';
import SingerContent from './content';

function SingerDrawer({
  open,
  onClose,
  id,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  zIndex: number;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 'min(85%, 400px)' }} zIndex={zIndex} showClose={false}>
        <SingerContent id={id} />
      </DrawerContent>
    </Drawer>
  );
}

export default SingerDrawer;
