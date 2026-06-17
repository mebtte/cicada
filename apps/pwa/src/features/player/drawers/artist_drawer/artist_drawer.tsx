import AppDrawer from '@/components/app_drawer';
import ArtistContent from './content';

function ArtistDrawer({
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
    <AppDrawer
      open={open}
      onClose={onClose}
      width="wide"
      zIndex={zIndex}
      showClose={false}
    >
      <ArtistContent id={id} insideDrawer />
    </AppDrawer>
  );
}

export default ArtistDrawer;
