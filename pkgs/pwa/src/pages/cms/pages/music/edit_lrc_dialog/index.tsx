import React, { useCallback, useEffect, useState } from 'react';

import Dialog from '@/components/dialog';
import { Music } from '../constants';
import eventemitter, { EventType } from '../eventemitter';
import Content from './content';

const bodyProps = {
  style: { width: 720 },
};

const EditMusicLrcDialog = () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  const [music, setMusic] = useState<Music | null>(null);

  useEffect(() => {
    const openListener = (m: Music) => {
      setMusic(m);
      setOpen(true);
    };
    eventemitter.on(EventType.OPEN_EDIT_LRC_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_EDIT_LRC_DIALOG, openListener);
  }, []);

  return (
    <Dialog open={open} bodyProps={bodyProps}>
      {music ? <Content music={music} onClose={onClose} /> : null}
    </Dialog>
  );
};

export default React.memo(EditMusicLrcDialog);
