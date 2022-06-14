import { useCallback } from 'react';
import { COVER_MAX_SIZE } from '@/constants/musicbill';
import ImageCutterDialog from '@/components/image_cutter_dialog';
import updateMusicbill from '@/server_new/update_musicbill';
import { AllowUpdateKey } from '#/constants/musicbill';
import uploadAsset from '@/server_new/upload_asset';
import { AssetType } from '#/constants';
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
      const asset = await uploadAsset(image, AssetType.MUSICBILL_COVER);
      await updateMusicbill(musicbill.id, AllowUpdateKey.COVER, asset.id);
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
