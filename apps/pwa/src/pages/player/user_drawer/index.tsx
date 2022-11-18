import { useEffect, useState } from 'react';
import UserDrawer from './user_drawer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

function Wrapper() {
  // const [open, setOpen] = useState(false);
  // const [id, setId] = useState('');
  const [open, setOpen] = useState(true);
  const [id, setId] = useState('333333');

  useEffect(() => {
    const unlistenOpen = playerEventemitter.listen(
      PlayerEventType.OPEN_USER_DRAWER,
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
  return <UserDrawer open={open} onClose={onClose} id={id} />;
}

export default Wrapper;
