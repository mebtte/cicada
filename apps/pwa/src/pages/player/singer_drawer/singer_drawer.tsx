import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import SingerContent from './content';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 'min(85%, 400px)',
  },
};

function SingerDrawer({
  zIndex,
  open,
  onClose,
  id,
}: {
  zIndex: number;
  open: boolean;
  onClose: () => void;
  id: string;
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      <SingerContent id={id} />
    </Drawer>
  );
}

export default SingerDrawer;
