import AppDrawer from '@/components/app_drawer';
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
  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      width="medium"
      zIndex={zIndex}
      showClose={false}
    >
      <MusicContent id={id} insideDrawer />
    </AppDrawer>
  );
}

export default MusicDrawer;
