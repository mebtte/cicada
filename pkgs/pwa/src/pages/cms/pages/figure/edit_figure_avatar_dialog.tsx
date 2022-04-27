import React, { useEffect, useState } from 'react';

import cmsUpdateFigure, { Key } from '@/server/cms_update_figure';
import { AVATAR_MAX_SIZE } from '@/constants/figure';
import ImageCutterDialog from '@/components/image_cutter_dialog';
import eventemitter, { EventType } from './eventemitter';
import { Figure } from './constants';

const AVATAR_SIZE = {
  width: AVATAR_MAX_SIZE,
  height: AVATAR_MAX_SIZE,
};

const EditFigureAvatarDialog = () => {
  const [figure, setFigure] = useState<Figure>(null);
  const onClose = () => setFigure(null);
  const onUpdate = async (file: File) => {
    await cmsUpdateFigure({ id: figure.id, key: Key.AVATAR, value: file });
    eventemitter.emit(EventType.FIGURE_CREATED_OR_UPDATED_OR_DELETED);
  };

  useEffect(() => {
    const openListener = (f: Figure) => setFigure(f);
    eventemitter.on(EventType.OPEN_EDIT_FIGURE_AVATAR_DIALOG, openListener);
    return () =>
      void eventemitter.off(
        EventType.OPEN_EDIT_FIGURE_AVATAR_DIALOG,
        openListener,
      );
  }, []);

  return (
    <ImageCutterDialog
      open={!!figure}
      onClose={onClose}
      imageSize={AVATAR_SIZE}
      onUpdate={onUpdate}
    />
  );
};

export default React.memo(EditFigureAvatarDialog);
