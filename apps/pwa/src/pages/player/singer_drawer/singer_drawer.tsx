import { Drawer, DrawerContent } from '@/components';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
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
  const { top: titlebarTop } = useTitlebarOverlayInsets();

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 'min(85%, 400px)', paddingTop: titlebarTop }}
        zIndex={zIndex}
        showClose={false}
      >
        <SingerContent id={id} insideDrawer />
      </DrawerContent>
    </Drawer>
  );
}

export default SingerDrawer;
