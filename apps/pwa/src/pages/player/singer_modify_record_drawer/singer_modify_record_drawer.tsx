import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import { Singer } from './constants';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 300,
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
      styled_function_component
    </Drawer>
  );
}

export default SingerModifyRecordDrawer;
