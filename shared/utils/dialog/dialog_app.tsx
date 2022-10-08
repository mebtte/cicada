import { useCallback, useEffect, useState } from 'react';
import generateRandomString from '../generate_random_string';
import { Dialog, DialogType } from './constants';
import DialogItem from './dialog_item';
import e, { EventType } from './eventemitter';

function DialogApp() {
  const [dialogList, setDialogList] = useState<Dialog[]>([]);
  const onDestroy = useCallback(
    (id: string) => setDialogList((dl) => dl.filter((d) => d.id !== id)),
    [],
  );

  useEffect(() => {
    const unlistenAlert = e.listen(EventType.OPEN_ALERT, (alert) =>
      setDialogList((dl) => [
        ...dl,
        {
          ...alert,
          id: generateRandomString(6, false),
          type: DialogType.ALERT,
        },
      ]),
    );
    const unlistenConfirm = e.listen(EventType.OPEN_CONFIRM, (confirm) =>
      setDialogList((dl) => [
        ...dl,
        {
          ...confirm,
          id: generateRandomString(6, false),
          type: DialogType.CONFIRM,
        },
      ]),
    );
    return () => {
      unlistenAlert();
      unlistenConfirm();
    };
  }, []);

  return (
    <>
      {dialogList.map((d) => (
        <DialogItem key={d.id} dialog={d} onDestroy={onDestroy} />
      ))}
    </>
  );
}

export default DialogApp;
