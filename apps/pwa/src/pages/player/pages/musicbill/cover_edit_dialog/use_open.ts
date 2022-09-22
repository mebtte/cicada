import { useCallback, useEffect, useState } from 'react';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpenCoverEditDialog = eventemitter.listen(
      EventType.OPEN_COVER_EDIT_DIALOG,
      () => setOpen(true),
    );
    return unlistenOpenCoverEditDialog;
  }, []);

  return { open, onClose };
};
