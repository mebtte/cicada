import styled from 'styled-components';
import Popup from '#/components/popup';
import { CSSProperties, useEffect, useState } from 'react';
import MenuItem from '#/components/menu_item';
import { MdImage, MdTitle, MdPublic, MdPublicOff } from 'react-icons/md';
import updateMusicbill from '@/server/update_musicbill';
import { AllowUpdateKey, NAME_MAX_LENGTH } from '#/constants/musicbill';
import uploadAsset from '@/server/upload_asset';
import { AssetType } from '#/constants';
import dialog from '#/utils/dialog';
import logger from '#/utils/logger';
import notice from '#/utils/notice';
import playerEventemitter, {
  EditDialogType,
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Musicbill, ZIndex } from '../../constants';
import e, { EventType } from './eventemitter';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.POPUP,
  },
};
const bodyProps: { style: CSSProperties } = {
  style: {
    maxWidth: 300,
  },
};
const Style = styled.div`
  padding: 10px 0;
`;

function EditMenu({ musicbill }: { musicbill: Musicbill }) {
  const [open, setOpen] = useState(false);
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
          label="修改封面"
          icon={<MdImage />}
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.COVER,
              title: '修改封面',
              onSubmit: async (cover: File | null) => {
                if (!cover) {
                  throw new Error('请选择封面');
                }

                const { id } = await uploadAsset(
                  cover,
                  AssetType.MUSICBILL_COVER,
                );
                await updateMusicbill({
                  id: musicbill.id,
                  key: AllowUpdateKey.COVER,
                  value: id,
                });

                playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
                  id: musicbill.id,
                });
              },
            })
          }
        />
        <MenuItem
          label="修改名字"
          icon={<MdTitle />}
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              type: EditDialogType.INPUT,
              title: '修改名字',
              label: '名字',
              initialValue: musicbill.name,
              maxLength: NAME_MAX_LENGTH,
              onSubmit: async (name: string) => {
                const trimmedName = name.replace(/\s+/g, ' ').trim();
                if (!trimmedName) {
                  throw new Error('请输入名字');
                }
                if (trimmedName !== musicbill.name) {
                  await updateMusicbill({
                    id: musicbill.id,
                    key: AllowUpdateKey.NAME,
                    value: trimmedName,
                  });

                  playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
                    id: musicbill.id,
                  });
                }
              },
            })
          }
        />
        <MenuItem
          label={musicbill.public ? '设为隐蔽乐单' : '设为公开乐单'}
          icon={musicbill.public ? <MdPublicOff /> : <MdPublic />}
          onClick={() => {
            if (musicbill.public) {
              return dialog.confirm({
                title: '是否将乐单设为隐藏?',
                content:
                  '设为隐藏将会从个人主页移除该乐单, 且会从用户的收藏列表中移除',
                onConfirm: async () =>
                  updateMusicbill({
                    id: musicbill.id,
                    key: AllowUpdateKey.PUBLIC,
                    value: false,
                  })
                    .then(() =>
                      playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
                        id: musicbill.id,
                      }),
                    )
                    .catch((error) => {
                      logger.error(error, '更新乐单失败');
                      notice.error(error.message);
                    }),
              });
            }
            return dialog.confirm({
              title: '是否将乐单设为公开?',
              content: '公开的乐单将会出现在个人主页上, 且用户可以收藏',
              onConfirm: async () =>
                updateMusicbill({
                  id: musicbill.id,
                  key: AllowUpdateKey.PUBLIC,
                  value: true,
                })
                  .then(() =>
                    playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
                      id: musicbill.id,
                    }),
                  )
                  .catch((error) => {
                    logger.error(error, '更新乐单失败');
                    notice.error(error.message);
                  }),
            });
          }}
        />
      </Style>
    </Popup>
  );
}

export default EditMenu;
