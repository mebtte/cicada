import Popup from '@/components/popup';
import { CSSProperties, MouseEventHandler, useEffect, useState } from 'react';
import MenuItem from '@/components/menu_item';
import {
  MdImage,
  MdTitle,
  MdTextFields,
  MdOutlineHistory,
} from 'react-icons/md';
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
import { t } from '@/i18n';
import { ZIndex } from '../constants';
import e, { EventType } from './eventemitter';
import { Singer } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

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
const itemStyle: CSSProperties = { margin: '0 10px' };

function EditMenu({ singer }: { singer: Singer }) {
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
          style={itemStyle}
          icon={<MdImage />}
          label={t('edit_avatar')}
          onClick={() =>
            dialog.imageCut({
              title: t('edit_avatar'),
              onConfirm: async (blob) => {
                if (!blob) {
                  notice.error(t('empty_avatar_warning'));
                  return false;
                }
                try {
                  const { id: assetId } = await uploadAsset(
                    blob,
                    AssetType.SINGER_AVATAR,
                  );
                  await updateSinger({
                    id: singer.id,
                    key: AllowUpdateKey.AVATAR,
                    value: assetId,
                  });
                  playerEventemitter.emit(PlayerEventType.SINGER_UPDATED, {
                    id: singer.id,
                  });
                } catch (error) {
                  logger.error(error, "Failed to update singers'avatar");
                  notice.error(error.message);
                  return false;
                }
              },
            })
          }
        />
        {singer.avatar.length ? (
          <MenuItem
            style={itemStyle}
            icon={<MdImage />}
            label={t('reset_avatar')}
            onClick={() =>
              dialog.confirm({
                content: t('reset_avatar_question'),
                onConfirm: async () => {
                  try {
                    await updateSinger({
                      id: singer.id,
                      key: AllowUpdateKey.AVATAR,
                      value: '',
                    });
                    playerEventemitter.emit(PlayerEventType.SINGER_UPDATED, {
                      id: singer.id,
                    });
                  } catch (error) {
                    logger.error(error, "Failed to reset singer's avatar");
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
          style={itemStyle}
          icon={<MdTitle />}
          label={t('edit_name')}
          onClick={() =>
            dialog.input({
              title: t('edit_name'),
              label: t('name'),
              initialValue: singer.name,
              maxLength: NAME_MAX_LENGTH,
              onConfirm: async (name: string) => {
                const trimmedName = name.replace(/\s+/g, ' ').trim();
                if (!trimmedName) {
                  notice.error(t('empty_name_warning'));
                  return false;
                }
                if (singer.name !== trimmedName) {
                  try {
                    await updateSinger({
                      id: singer.id,
                      key: AllowUpdateKey.NAME,
                      value: trimmedName,
                    });
                    playerEventemitter.emit(PlayerEventType.SINGER_UPDATED, {
                      id: singer.id,
                    });
                  } catch (error) {
                    logger.error(error, "Failed to update singer's name");
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
        <MenuItem
          style={itemStyle}
          icon={<MdTextFields />}
          label={t('edit_alias')}
          onClick={() =>
            dialog.inputList({
              title: t('edit_alias'),
              label: t('alias'),
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
                    playerEventemitter.emit(PlayerEventType.SINGER_UPDATED, {
                      id: singer.id,
                    });
                  } catch (error) {
                    logger.error(error, "Failed to update singer's alias");
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
        <MenuItem
          style={itemStyle}
          icon={<MdOutlineHistory />}
          label={t('view_modify_record')}
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.OPEN_SINGER_MODIFY_RECORD_DRAWER,
              {
                singer,
              },
            )
          }
        />
      </Style>
    </Popup>
  );
}

export default EditMenu;
