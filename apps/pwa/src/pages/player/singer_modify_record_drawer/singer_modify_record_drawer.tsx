import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import { Singer } from './constants';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';
import Content from './content';
import Hint from './hint';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 300,
    overflow: 'auto',
  },
};

function SingerModifyRecordDrawer({
  singer,
  open,
  onClose,
}: {
  singer: Singer;
  open: boolean;
  onClose: () => void;
}) {
  const zIndex = useDynamicZIndex(EventType.OPEN_SINGER_MODIFY_RECORD_DRAWER);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{
        style: { zIndex },
      }}
      bodyProps={bodyProps}
    >
      <Content singer={singer} />
      <Hint />
    </Drawer>
  );
}

export default SingerModifyRecordDrawer;
