import { RequestStatus } from '@/constants';
import { useCallback, useContext, useEffect, useState } from 'react';
import Context from '../context';
import MusicbillOrderDrawer from './musicbill_order_drawer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

function Wrapper() {
  const { getMusicbillListStatus, musicbillList } = useContext(Context);
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpen = playerEventemitter.listen(
      PlayerEventType.OPEN_MUSICBILL_ORDER_DRAWER,
      () => setOpen(true),
    );
    return unlistenOpen;
  }, []);

  if (getMusicbillListStatus === RequestStatus.SUCCESS) {
    return (
      <MusicbillOrderDrawer
        open={open}
        onClose={onClose}
        musicbillList={musicbillList}
      />
    );
  }
  return null;
}

export default Wrapper;
