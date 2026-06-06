import useOpen from './use_open';
import ArtistModifyRecordDrawer from './singer_modify_record_drawer';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

function Wrapper() {
  const { artist, open, onClose } = useOpen();
  const zIndex = useDynamicZIndex(EventType.OPEN_ARTIST_MODIFY_RECORD_DRAWER);

  if (!artist) {
    return null;
  }
  return (
    <ArtistModifyRecordDrawer
      artist={artist}
      open={open}
      onClose={onClose}
      zIndex={zIndex}
    />
  );
}

export default Wrapper;
