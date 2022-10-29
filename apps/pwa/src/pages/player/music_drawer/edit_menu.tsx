import Popup from '#/components/popup';
import { CSSProperties, MouseEventHandler, useEffect, useState } from 'react';
import MenuItem from '#/components/menu_item';
import { MdDelete, MdEdit } from 'react-icons/md';
import { CSSVariable } from '#/global_style';
import styled from 'styled-components';
import notice from '#/utils/notice';
import { AllowUpdateKey, MusicType } from '#/constants/music';
import uploadAsset from '@/server/upload_asset';
import { AssetType } from '#/constants';
import updateMusic from '@/server/update_music';
import { ZIndex } from '../constants';
import { MusicDetail } from './constants';
import e, { EventType } from './eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
  EditDialogType,
} from '../eventemitter';

const Style = styled.div`
  padding: 5px 0;
`;
const maskProps: {
  style: CSSProperties;
  onClick: MouseEventHandler<HTMLDivElement>;
} = {
  style: { zIndex: ZIndex.POPUP },
  onClick: (event) => event.stopPropagation(),
};
const dangerousIconStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function EditMenu({
  music,
  reload,
}: {
  music: MusicDetail;
  reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_EDIT_MENU, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return (
    <Popup open={open} onClose={onClose} maskProps={maskProps}>
      <Style onClick={onClose}>
        <MenuItem
          icon={<MdEdit />}
          label="编辑封面"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              title: '编辑封面',
              type: EditDialogType.COVER,
              onSubmit: async (cover: Blob | undefined) => {
                if (typeof cover === 'undefined') {
                  throw new Error('请选择封面');
                }
                const { id: assetId } = await uploadAsset(
                  cover,
                  AssetType.MUSIC_COVER,
                );
                await updateMusic({
                  id: music.id,
                  key: AllowUpdateKey.COVER,
                  value: assetId,
                });
                reload();
              },
            })
          }
        />
        {music.type === MusicType.SONG ? (
          <MenuItem
            icon={<MdEdit />}
            label="编辑歌词"
            onClick={() =>
              playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
                title: '编辑歌词',
                type: EditDialogType.TEXTAREA_LIST,
                onSubmit: () => {},
              })
            }
          />
        ) : null}
        <MenuItem
          icon={<MdDelete style={dangerousIconStyle} />}
          label="删除"
          onClick={() => notice.info('todo')}
        />
      </Style>
    </Popup>
  );
}

export default EditMenu;
