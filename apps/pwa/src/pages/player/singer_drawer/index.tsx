import SingerDrawer from './singer_drawer';
import useOpen from './use_open';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

function Wrapper() {
  const { id, open, onClose, miniMode } = useOpen();
  const zIndex = useDynamicZIndex(EventType.OPEN_SINGER_DRAWER);

  if (!id || miniMode) {
    return null;
  }
  return <SingerDrawer open={open} onClose={onClose} id={id} zIndex={zIndex} />;
}

export default Wrapper;
