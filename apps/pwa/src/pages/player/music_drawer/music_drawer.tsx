import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import MusicContent from './content';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 'min(350px, 85%)',
  },
};

function MusicDrawer({
  zIndex,
  id,
  open,
  onClose,
}: {
  zIndex: number;
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      <MusicContent id={id} />
    </Drawer>
  );
}

export default MusicDrawer;
