import { useCallback } from 'react';

import { COVER_MAX_SIZE } from '@/constants/musicbill';
import updateMusicbill, { Key } from '@/server/update_musicbill';
import ImageCutterDialog from '@/components/image_cutter_dialog';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { Musicbill } from '../../../constants';
import useOpen from './use_open';

const COVER_SIZE = {
  width: COVER_MAX_SIZE,
  height: COVER_MAX_SIZE,
};

function CoverEditDialog({ musicbill }: { musicbill: Musicbill }) {
  const { open, onClose } = useOpen();

  const onUpdate = useCallback(
    async (image: File) => {
      await updateMusicbill({
        id: musicbill.id,
        key: Key.COVER,
        value: image,
      });
      playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL_LIST, {});
    },
    [musicbill],
  );
  return (
    <ImageCutterDialog
      open={open}
      onClose={onClose}
      onUpdate={onUpdate}
      imageSize={COVER_SIZE}
    />
  );
}

export default CoverEditDialog;
