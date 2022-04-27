import React, { useEffect, useState } from 'react';

import cmsUpdateMusic, { Key } from '@/server/cms_update_music';
import { COVER_MAX_SIZE } from '@/constants/music';
import ImageCutterDialog from '@/components/image_cutter_dialog';
import eventemitter, { EventType } from './eventemitter';
import { Music } from './constants';

const COVER_SIZE = {
  width: COVER_MAX_SIZE,
  height: COVER_MAX_SIZE,
};

const EditFigureAvatarDialog = () => {
  const [music, setMusic] = useState<Music>(null);
  const onClose = () => setMusic(null);
  const onUpdate = async (file: File) => {
    await cmsUpdateMusic({ id: music.id, key: Key.COVER, value: file });
    eventemitter.emit(EventType.MUSIC_CREATED_OR_UPDATED_OR_DELETED);
  };

  useEffect(() => {
    const openListener = (m: Music) => setMusic(m);
    eventemitter.on(EventType.OPEN_EDIT_COVER_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_EDIT_COVER_DIALOG, openListener);
  }, []);

  return (
    <ImageCutterDialog
      open={!!music}
      onClose={onClose}
      imageSize={COVER_SIZE}
      onUpdate={onUpdate}
    />
  );
};

export default EditFigureAvatarDialog;
