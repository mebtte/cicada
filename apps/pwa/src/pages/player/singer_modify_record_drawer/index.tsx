import useOpen from './use_open';
import SingerModifyRecordDrawer from './singer_modify_record_drawer';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

function Wrapper() {
  const { singer, open, onClose } = useOpen();
  const zIndex = useDynamicZIndex(EventType.OPEN_SINGER_MODIFY_RECORD_DRAWER);

  if (!singer) {
    return null;
  }
  return (
    <SingerModifyRecordDrawer
      singer={singer}
      open={open}
      onClose={onClose}
      zIndex={zIndex}
    />
  );
}

export default Wrapper;
