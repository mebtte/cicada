import ArtistDrawer from './artist_drawer';
import useOpen from './use_open';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

function Wrapper() {
  const { id, open, onClose } = useOpen();
  const zIndex = useDynamicZIndex(EventType.OPEN_ARTIST_DRAWER);

  if (!id) {
    return null;
  }
  return <ArtistDrawer open={open} onClose={onClose} id={id} zIndex={zIndex} />;
}

export default Wrapper;
