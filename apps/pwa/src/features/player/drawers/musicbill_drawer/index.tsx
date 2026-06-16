import { useEffect, useState } from 'react';
import MusicbillDrawer from './musicbill_drawer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import useDynamicZIndex from '../../use_dynamic_z_index';

function Wrapper() {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const zIndex = useDynamicZIndex(PlayerEventType.OPEN_MUSICBILL_DRAWER);

  useEffect(() => {
    const unlistenOpen = playerEventemitter.listen(
      PlayerEventType.OPEN_MUSICBILL_DRAWER,
      (data) => {
        setId(data.id);
        return setOpen(true);
      },
    );
    return unlistenOpen;
  }, []);

  if (!id) {
    return null;
  }

  const onClose = () => setOpen(false);
  return (
    <MusicbillDrawer open={open} onClose={onClose} id={id} zIndex={zIndex} />
  );
}

export default Wrapper;
