import {
  ChangeEventHandler,
  KeyboardEvent,
  useEffect,
  useState,
} from 'react';
import styled from 'styled-components';
import {
  MdDeleteOutline,
  MdExitToApp,
} from 'react-icons/md';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  Input,
} from '@/components';
import { IconEdit } from '@/components/icon';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import updateMusicbill from '@/server/api/update_musicbill';
import { AllowUpdateKey, NAME_MAX_LENGTH } from '@/constants/musicbill';
import uploadAsset from '@/server/form/upload_asset';
import { AssetType } from '@/constants/asset';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import deleteMusicbill from '@/server/api/delete_musicbill';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useNavigate from '@/utils/use_navigate';
import { useUser } from '@/global_states/server';
import { t } from '@/i18n';
import getResizedImage from '@/server/asset/get_resized_image';
import e, { EventType } from './eventemitter';
import { Musicbill } from '../../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { quitSharedMusicbill } from './utils';

const COVER_SIZE = 128;
const EDIT_DRAWER_Z_INDEX = 8000;

const DrawerInner = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
`;

const Body = styled(DrawerBody)`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  font-weight: 800;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  text-transform: capitalize;
`;

const CurrentCoverBox = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const CoverArt = styled(Cover)`
  flex: 0 0 auto;
  box-sizing: border-box;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 5px 0 rgb(185 185 185);
`;

const CoverActions = styled.div`
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`;

const NameSection = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;

  > .input {
    flex: 1;
    min-width: 0;
  }

  > .button {
    flex-shrink: 0;
  }
`;

const PublicField = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 44px;
`;

const SwitchButton = styled.button<{ $checked: boolean }>`
  position: relative;
  flex: 0 0 auto;
  width: 58px;
  height: 34px;
  padding: 3px;
  border: 2px solid
    ${({ $checked }) =>
      $checked ? CSSVariable.COLOR_PRIMARY_ACTIVE : 'rgb(180 180 180)'};
  border-radius: 999px;
  background: ${({ $checked }) =>
    $checked ? CSSVariable.COLOR_PRIMARY : '#fff'};
  box-shadow: 0 4px 0
    ${({ $checked }) =>
      $checked ? CSSVariable.COLOR_PRIMARY_ACTIVE : 'rgb(180 180 180)'};
  cursor: pointer;
  transition:
    transform 150ms ease-out,
    background 150ms ease,
    box-shadow 150ms ease,
    filter 120ms;

  &:not(:disabled):hover {
    filter: brightness(1.04);
  }

  &:not(:disabled):active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    filter: saturate(0.45);
  }

  &:focus-visible {
    outline: 3px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 3px;
  }

  > .thumb {
    display: block;
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    border: 2px solid
      ${({ $checked }) =>
        $checked ? CSSVariable.COLOR_PRIMARY_ACTIVE : 'rgb(180 180 180)'};
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 0
      ${({ $checked }) =>
        $checked ? CSSVariable.COLOR_PRIMARY_ACTIVE : 'rgb(180 180 180)'};
    transform: translateX(${({ $checked }) => ($checked ? '24px' : '0')});
    transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

const DangerArea = styled.div`
  padding-top: 8px;
`;

function EditMenu({ musicbill }: { musicbill: Musicbill }) {
  const navigate = useNavigate();
  const user = useUser()!;

  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  const [name, setName] = useState(musicbill.name);
  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const [publiz, setPubliz] = useState(musicbill.public);
  const [coverUpdating, setCoverUpdating] = useState(false);
  const [nameUpdating, setNameUpdating] = useState(false);
  const [publizUpdating, setPublizUpdating] = useState(false);
  const updating = coverUpdating || nameUpdating || publizUpdating;

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_EDIT_MENU, () => {
      setName(musicbill.name);
      setPubliz(musicbill.public);
      setOpen(true);
    });
    return unlistenOpen;
  }, [musicbill.name, musicbill.public]);

  useEffect(() => {
    setName(musicbill.name);
  }, [musicbill.name]);

  useEffect(() => {
    setPubliz(musicbill.public);
  }, [musicbill.public]);

  const reloadMusicbill = () =>
    playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
      id: musicbill.id,
      silence: false,
    });

  const editCover = () =>
    dialog.imageCut({
      title: t('edit_cover'),
      onConfirm: async (cover) => {
        if (!cover) {
          notice.error(t('empty_cover_warning'));
          return false;
        }

        setCoverUpdating(true);
        try {
          const { id } = await uploadAsset(cover, AssetType.MUSICBILL_COVER);
          await updateMusicbill({
            id: musicbill.id,
            key: AllowUpdateKey.COVER,
            value: id,
          });
          reloadMusicbill();
        } catch (error) {
          logger.error(error, "Updating musicbill's cover fail");
          dialog.alert({ content: error.message });
          return false;
        } finally {
          setCoverUpdating(false);
        }
      },
    });

  const updateName = async () => {
    const trimmedName = name.replace(/\s+/g, ' ').trim();
    if (!trimmedName) {
      notice.error(t('empty_name_warning'));
      return;
    }
    if (trimmedName === musicbill.name) {
      return;
    }

    setNameUpdating(true);
    try {
      await updateMusicbill({
        id: musicbill.id,
        key: AllowUpdateKey.NAME,
        value: trimmedName,
      });
      reloadMusicbill();
    } catch (error) {
      logger.error(error, "Failed to update musicbill's name");
      dialog.alert({ content: error.message });
    }
    setNameUpdating(false);
  };

  const onNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void updateName();
    }
  };

  const updatePubliz = async () => {
    if (publizUpdating) {
      return;
    }

    const nextPubliz = !publiz;
    setPubliz(nextPubliz);
    setPublizUpdating(true);
    try {
      await updateMusicbill({
        id: musicbill.id,
        key: AllowUpdateKey.PUBLIC,
        value: nextPubliz,
      });
      reloadMusicbill();
    } catch (error) {
      setPubliz(musicbill.public);
      logger.error(error, "Failed to update musicbill's public state");
      dialog.alert({ content: error.message });
    }
    setPublizUpdating(false);
  };

  const openDeleteDialog = () => {
    onClose();
    window.setTimeout(() => {
      dialog.captcha({
        confirmText: t('delete_musicbill'),
        confirmVariant: 'danger',
        onConfirm: async ({ captchaId, captchaValue }) => {
          try {
            await deleteMusicbill({
              id: musicbill.id,
              captchaId,
              captchaValue,
            });
            playerEventemitter.emit(PlayerEventType.MUSICBILL_DELETED, null);
            navigate({
              path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
            });
          } catch (error) {
            logger.error(error, 'Failed to delete musicbill');
            dialog.alert({ content: error.message });

            return false;
          }
        },
      });
    }, 0);
  };

  const openLeaveDialog = () => {
    onClose();
    window.setTimeout(() => {
      quitSharedMusicbill({
        musicbillId: musicbill.id,
        afterQuitted: () =>
          navigate({
            path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
          }),
      });
    }, 0);
  };

  const trimmedName = name.replace(/\s+/g, ' ').trim();
  const canUpdateName = !nameUpdating && !!trimmedName && trimmedName !== musicbill.name;

  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 'min(390px, calc(100vw - 20px))' }}
        zIndex={EDIT_DRAWER_Z_INDEX}
        accessibleTitle={t('edit_musicbill')}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DrawerInner>
          <DrawerHeader>
            <DrawerTitle>{t('edit_musicbill')}</DrawerTitle>
          </DrawerHeader>
          <Body>
            <Field>
              <CurrentCoverBox>
                <CoverArt
                  src={getResizedImage({
                    url: musicbill.cover,
                    size: COVER_SIZE * 2,
                  })}
                  size={COVER_SIZE}
                />
                <CoverActions>
                  <Button
                    square
                    variant="secondary"
                    size="sm"
                    loading={coverUpdating}
                    title={t('edit_cover')}
                    aria-label={t('edit_cover')}
                    onClick={editCover}
                  >
                    <IconEdit size={18} />
                  </Button>
                </CoverActions>
              </CurrentCoverBox>
            </Field>

            <NameSection>
              <Input
                className="input"
                label={t('name')}
                value={name}
                onChange={onNameChange}
                onKeyDown={onNameKeyDown}
                maxLength={NAME_MAX_LENGTH}
                disabled={nameUpdating}
              />
              <Button
                className="button"
                variant="primary"
                onClick={() => void updateName()}
                disabled={!canUpdateName}
                loading={nameUpdating}
              >
                {t('save')}
              </Button>
            </NameSection>

            <PublicField>
              <FieldTitle>{t('public')}</FieldTitle>
              <SwitchButton
                type="button"
                role="switch"
                aria-checked={publiz}
                aria-label={t('public')}
                $checked={publiz}
                disabled={publizUpdating}
                onClick={() => void updatePubliz()}
              >
                <span className="thumb" />
              </SwitchButton>
            </PublicField>

            <DangerArea>
              {musicbill.owner.id === user.id ? (
                <Button
                  block
                  variant="danger"
                  disabled={updating}
                  icon={<MdDeleteOutline />}
                  onClick={openDeleteDialog}
                >
                  {t('delete_musicbill')}
                </Button>
              ) : (
                <Button
                  block
                  variant="danger"
                  disabled={updating}
                  icon={<MdExitToApp />}
                  onClick={openLeaveDialog}
                >
                  {t('leave_shared_musicbill')}
                </Button>
              )}
            </DangerArea>
          </Body>
        </DrawerInner>
      </DrawerContent>
    </Drawer>
  );
}

export default EditMenu;
