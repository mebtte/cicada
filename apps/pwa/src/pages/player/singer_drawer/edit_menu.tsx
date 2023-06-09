import Popup from '@/components/popup';
import { CSSProperties, MouseEventHandler, useEffect, useState } from 'react';
import MenuItem from '@/components/menu_item';
import { MdImage, MdTitle, MdTextFields } from 'react-icons/md';
import styled from 'styled-components';
import uploadAsset from '@/server/form/upload_asset';
import { AssetType } from '#/constants';
import updateSinger from '@/server/api/update_singer';
import {
  ALIAS_MAX_LENGTH,
  AllowUpdateKey,
  NAME_MAX_LENGTH,
} from '#/constants/singer';
import stringArrayEqual from '#/utils/string_array_equal';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import { ZIndex } from '../constants';
import e, { EventType } from './eventemitter';
import playerEventemitter, {
  EditDialogType,
  EventType as PlayerEventType,
} from '../eventemitter';
import { SingerDetail } from './constants';
import { emitSingerUpdated } from '../utils';

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
  padding: 10px 0 max(env(safe-area-inset-bottom, 10px), 10px) 0;
`;

function EditMenu({ singer }: { singer: SingerDetail }) {
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
          icon={<MdImage />}
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
                emitSingerUpdated(singer.id);
              },
            })
          }
        />
        {singer.avatar.length ? (
          <MenuItem
            icon={<MdImage />}
            label="重置头像"
            onClick={() =>
              dialog.confirm({
                title: '确定重置头像吗?',
                content: '重置后歌手将使用默认头像',
                onConfirm: async () => {
                  try {
                    await updateSinger({
                      id: singer.id,
                      key: AllowUpdateKey.AVATAR,
                      value: '',
                    });
                    emitSingerUpdated(singer.id);
                  } catch (error) {
                    logger.error(error, '重置歌手头像失败');
                    dialog.alert({
                      content: error.message,
                    });
                    return false;
                  }
                },
              })
            }
          />
        ) : null}
        <MenuItem
          icon={<MdTitle />}
          label="编辑名字"
          onClick={() =>
            dialog.input({
              title: '编辑名字',
              label: '名字',
              initialValue: singer.name,
              maxLength: NAME_MAX_LENGTH,
              onConfirm: async (name: string) => {
                const trimmedName = name.replace(/\s+/g, ' ').trim();
                if (!trimmedName) {
                  notice.error('请输入名字');
                  return false;
                }
                if (singer.name !== trimmedName) {
                  try {
                    await updateSinger({
                      id: singer.id,
                      key: AllowUpdateKey.NAME,
                      value: trimmedName,
                    });
                    emitSingerUpdated(singer.id);
                  } catch (error) {
                    logger.error(error, '更新歌手名字失败');
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
        <MenuItem
          icon={<MdTextFields />}
          label="编辑别名"
          onClick={() =>
            dialog.inputList({
              title: '编辑别名',
              label: '别名',
              initialValue: singer.aliases,
              maxLength: ALIAS_MAX_LENGTH,
              onConfirm: async (aliases: string[]) => {
                const trimmedAliases = aliases
                  .map((a) => a.replace(/\s+/g, ' ').trim())
                  .filter((a) => a.length > 0);

                if (!stringArrayEqual(trimmedAliases, singer.aliases)) {
                  try {
                    await updateSinger({
                      id: singer.id,
                      key: AllowUpdateKey.ALIASES,
                      value: trimmedAliases,
                    });
                    emitSingerUpdated(singer.id);
                  } catch (error) {
                    logger.error(error, "Updating singer's aliases fail");
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
      </Style>
    </Popup>
  );
}

export default EditMenu;
