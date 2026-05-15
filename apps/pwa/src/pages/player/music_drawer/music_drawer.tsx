import { Drawer, DrawerContent } from '@/components';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import MusicContent from './content';

function MusicDrawer({
  id,
  open,
  onClose,
  zIndex,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  zIndex: number;
}) {
  const { top: titlebarTop } = useTitlebarOverlayInsets();

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 'min(82%, 360px)', paddingTop: titlebarTop }}
        zIndex={zIndex}
        showClose={false}
      >
        <MusicContent id={id} insideDrawer />
      </DrawerContent>
    </Drawer>
  );
}

export default MusicDrawer;
