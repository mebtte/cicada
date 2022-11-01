import Popup from '#/components/popup';
import { CSSProperties, MouseEventHandler, useEffect, useState } from 'react';
import MenuItem from '#/components/menu_item';
import { MdEdit } from 'react-icons/md';
import styled from 'styled-components';
import uploadAsset from '@/server/upload_asset';
import { AssetType } from '#/constants';
import updateSinger from '@/server/update_singer';
import { AllowUpdateKey } from '#/constants/singer';
import { ZIndex } from '../constants';
import e, { EventType } from './eventemitter';
import playerEventemitter, {
  EditDialogType,
  EventType as PlayerEventType,
} from '../eventemitter';
import { SingerDetail } from './constants';

const maskProps: {
  style: CSSProperties;
  onClick: MouseEventHandler<HTMLDivElement>;
} = {
  style: { zIndex: ZIndex.POPUP },
  onClick: (event) => event.stopPropagation(),
};
const bodyProps: { style: CSSProperties } = {
  style: { width: 300 },
};
const Style = styled.div`
  padding: 5px 0;
`;

function EditMenu({
  singer,
  reload,
}: {
  singer: SingerDetail;
  reload: () => void;
}) {
  const [open, setOpen] = useState(false);
  // const [open, setOpen] = useState(true);
  const onClose = () => setOpen(false);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_EDIT_MENU, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return (
    <Popup
      open={open}
      onClose={onClose}
      maskProps={maskProps}
      bodyProps={bodyProps}
    >
      <Style onClick={onClose}>
        <MenuItem
          icon={<MdEdit />}
          label="编辑头像"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.COVER,
              title: '编辑头像',
              onSubmit: async (blob: Blob | undefined) => {
                if (!blob) {
                  throw new Error('请选择头像');
                }
                const { id: assetId } = await uploadAsset(
                  blob,
                  AssetType.SINGER_AVATAR,
                );
                await updateSinger({
                  id: singer.id,
                  key: AllowUpdateKey.AVATAR,
                  value: assetId,
                });
                reload();
              },
            })
          }
        />
        <MenuItem
          icon={<MdEdit />}
          label="编辑名字"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.INPUT,
              title: '编辑名字',
              label: '名字',
              onSubmit: async (name: string) => {
                const trimmedName = name.replace(/\s+/g, ' ').trim();
                if (!trimmedName) {
                  throw new Error('请输入名字');
                }
                if (singer.name !== trimmedName) {
                  await updateSinger({
                    id: singer.id,
                    key: AllowUpdateKey.NAME,
                    value: trimmedName,
                  });
                  reload();
                }
              },
              initialValue: singer.name,
            })
          }
        />
        <MenuItem icon={<MdEdit />} label="编辑别名" />
      </Style>
    </Popup>
  );
}

export default EditMenu;
