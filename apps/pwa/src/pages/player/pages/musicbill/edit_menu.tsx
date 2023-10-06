import styled from 'styled-components';
import Popup from '@/components/popup';
import { CSSProperties, useEffect, useState } from 'react';
import MenuItem from '@/components/menu_item';
import {
  MdImage,
  MdTitle,
  MdPublic,
  MdPublicOff,
  MdDeleteOutline,
  MdExitToApp,
} from 'react-icons/md';
import updateMusicbill from '@/server/api/update_musicbill';
import { AllowUpdateKey, NAME_MAX_LENGTH } from '#/constants/musicbill';
import uploadAsset from '@/server/form/upload_asset';
import { AssetType } from '#/constants';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import { CSSVariable } from '@/global_style';
import deleteMusicbill from '@/server/api/delete_musicbill';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useNavigate from '@/utils/use_navigate';
import { Variant } from '@/components/button';
import { useUser } from '@/global_states/server';
import { t } from '@/i18n';
import e, { EventType } from './eventemitter';
import { Musicbill, ZIndex } from '../../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { quitSharedMusicbill } from './utils';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.POPUP,
  },
};
const Style = styled.div`
  padding: 10px 0 max(env(safe-area-inset-bottom, 10px), 10px) 0;
`;
const dangerStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};
const itemStyle: CSSProperties = {
  margin: '0 10px',
};

function EditMenu({ musicbill }: { musicbill: Musicbill }) {
  const navigate = useNavigate();
  const user = useUser()!;

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
          style={itemStyle}
          label={t('edit_cover')}
          icon={<MdImage />}
          onClick={() =>
            dialog.imageCut({
              title: t('edit_cover'),
              onConfirm: async (cover) => {
                if (!cover) {
                  notice.error(t('empty_cover_warning'));
                  return false;
                }
                try {
                  const { id } = await uploadAsset(
                    cover,
                    AssetType.MUSICBILL_COVER,
                  );
                  await updateMusicbill({
                    id: musicbill.id,
                    key: AllowUpdateKey.COVER,
                    value: id,
                  });
                  playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
                    id: musicbill.id,
                    silence: false,
                  });
                } catch (error) {
                  logger.error(error, "Updating musicbill's cover fail");
                  notice.error(error.message);
                  return false;
                }
              },
            })
          }
        />
        <MenuItem
          style={itemStyle}
          label={t('edit_name')}
          icon={<MdTitle />}
          onClick={() =>
            dialog.input({
              title: t('edit_name'),
              label: t('name'),
              initialValue: musicbill.name,
              maxLength: NAME_MAX_LENGTH,
              onConfirm: async (name: string) => {
                const trimmedName = name.replace(/\s+/g, ' ').trim();
                if (!trimmedName) {
                  notice.error(t('empty_name_warning'));
                  return false;
                }
                if (trimmedName !== musicbill.name) {
                  try {
                    await updateMusicbill({
                      id: musicbill.id,
                      key: AllowUpdateKey.NAME,
                      value: trimmedName,
                    });
                    playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
                      id: musicbill.id,
                      silence: false,
                    });
                  } catch (error) {
                    logger.error(error, "Failed to update musicbill's name");
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
          label={
            musicbill.public
              ? t('set_musicbill_as_private')
              : t('set_musicbill_as_public')
          }
          icon={musicbill.public ? <MdPublicOff /> : <MdPublic />}
          onClick={() => {
            if (musicbill.public) {
              return dialog.confirm({
                title: t('question_of_setting_musicbill_as_private'),
                content: t('instruction_of_setting_musicbill_as_private'),
                onConfirm: async () =>
                  updateMusicbill({
                    id: musicbill.id,
                    key: AllowUpdateKey.PUBLIC,
                    value: false,
                  })
                    .then(() =>
                      playerEventemitter.emit(
                        PlayerEventType.RELOAD_MUSICBILL,
                        {
                          id: musicbill.id,
                          silence: false,
                        },
                      ),
                    )
                    .catch((error) => {
                      logger.error(error, 'Fail to set musicbill as private');
                      notice.error(error.message);
                    }),
              });
            }
            return dialog.confirm({
              title: t('question_of_setting_musicbill_as_public'),
              content: t('instruction_of_setting_musicbill_as_public'),
              onConfirm: async () =>
                updateMusicbill({
                  id: musicbill.id,
                  key: AllowUpdateKey.PUBLIC,
                  value: true,
                })
                  .then(() =>
                    playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
                      id: musicbill.id,
                      silence: false,
                    }),
                  )
                  .catch((error) => {
                    logger.error(error, 'Failed to set musicbill as public');
                    notice.error(error.message);
                  }),
            });
          }}
        />
        {musicbill.owner.id === user.id ? (
          <MenuItem
            style={itemStyle}
            label={t('delete_musicbill')}
            icon={<MdDeleteOutline style={dangerStyle} />}
            onClick={() =>
              dialog.captcha({
                confirmText: t('delete_musicbill'),
                confirmVariant: Variant.DANGER,
                onConfirm: async ({ captchaId, captchaValue }) => {
                  try {
                    await deleteMusicbill({
                      id: musicbill.id,
                      captchaId,
                      captchaValue,
                    });
                    playerEventemitter.emit(
                      PlayerEventType.MUSICBILL_DELETED,
                      null,
                    );
                    navigate({
                      path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
                    });
                  } catch (error) {
                    logger.error(error, 'Failed to delete musicbill');
                    notice.error(error.message);

                    return false;
                  }
                },
              })
            }
          />
        ) : (
          <MenuItem
            style={itemStyle}
            label={t('leave_shared_musicbill')}
            icon={<MdExitToApp style={dangerStyle} />}
            onClick={() =>
              quitSharedMusicbill({
                musicbillId: musicbill.id,
                afterQuitted: () =>
                  navigate({
                    path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
                  }),
              })
            }
          />
        )}
      </Style>
    </Popup>
  );
}

export default EditMenu;
