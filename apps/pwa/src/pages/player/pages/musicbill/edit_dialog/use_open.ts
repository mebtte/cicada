import { useCallback, useEffect, useState } from 'react';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpenEditDialog = eventemitter.listen(
      EventType.OPEN_EDIT_DIALOG,
      () => setOpen(true),
    );
    return unlistenOpenEditDialog;
  }, []);

  return { open, onClose };
};
