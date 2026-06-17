import { Drawer, DrawerContent } from '@/components';
import styled from 'styled-components';
import useNavigate from '@/utils/use_navigate';
import Button from '@/components/button';
import dialog from '@/utils/dialog';
import notice from '@/utils/notice';
import addMusicbillSharedUser from '@/server/api/add_musicbill_shared_user';
import logger from '@/utils/logger';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import autoScrollbar from '@/style/auto_scrollbar';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { USERNAME_MAX_LENGTH } from '@/constants/user';
import { useUser } from '@/global_states/server';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import User from './user';
import { Musicbill } from '../constants';
import e, { EventType } from '../eventemitter';
import { quitSharedMusicbill } from '../pages/musicbill/utils';
import { Logout, PersonAdd } from '@/components/icon';

const Content = styled.div`
  height: 100%;
  min-height: 0;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  background: #fff;
`;
const List = styled.div`
  flex: 1;
  min-height: 0;
  padding: 18px 14px;
  overflow: auto;
  ${autoScrollbar}
`;
const ActionBar = styled.div`
  flex: 0 0 auto;
  padding: 14px 18px max(18px, env(safe-area-inset-bottom, 18px));

  display: grid;
  gap: 12px;

  background: #fff;
  border-top: 2px solid ${CSSVariable.COLOR_BORDER};
`;

function ShareDrawer({
  open,
  onClose,
  musicbill,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  musicbill: Musicbill;
  zIndex: number;
}) {
  const navigate = useNavigate();
  const user = useUser()!;
  const { top: titlebarTop } = useTitlebarOverlayInsets();

  const owned = musicbill.owner.id === user.id;

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        accessibleTitle={t('shared_user')}
        style={{ width: 340 }}
        zIndex={zIndex}
      >
        <Content style={{ paddingTop: titlebarTop }}>
          <List>
            <User
              user={musicbill.owner}
              owner
              accepted
              musicbillId={musicbill.id}
            />
            {musicbill.sharedUserList.map((u) => (
              <User
                key={u.id}
                user={u}
                accepted={u.accepted}
                deletable={owned}
                transferable={owned}
                musicbillId={musicbill.id}
              />
            ))}
          </List>
          <ActionBar>
            <Button
              block
              icon={<PersonAdd />}
              variant="primary"
              onClick={() =>
                dialog.input({
                  label: t('username'),
                  maxLength: USERNAME_MAX_LENGTH,
                  confirmVariant: 'primary',
                  confirmText: t('invite'),
                  onConfirm: async (username) => {
                    if (
                      !username.length ||
                      username.length > USERNAME_MAX_LENGTH
                    ) {
                      notice.error(t('username_is_invalid'));
                      return false;
                    }

                    try {
                      await addMusicbillSharedUser({
                        musicbillId: musicbill.id,
                        username,
                      });
                      dialog.alert({ content: t('invitation_has_been_sent') });
                      e.emit(EventType.RELOAD_MUSICBILL, {
                        id: musicbill.id,
                        silence: true,
                      });
                    } catch (error) {
                      logger.error(error, 'Fail to invite shared user');
                      dialog.alert({ content: error.message });
                      return false;
                    }
                  },
                })
              }
            >
              {t('invite_user')}
            </Button>
            {owned ? null : (
              <Button
                block
                icon={<Logout />}
                variant="danger"
                onClick={() =>
                  quitSharedMusicbill({
                    musicbillId: musicbill.id,
                    afterQuitted: () =>
                      navigate({
                        path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
                      }),
                  })
                }
              >
                {t('leave_shared_musicbill_short')}
              </Button>
            )}
          </ActionBar>
        </Content>
      </DrawerContent>
    </Drawer>
  );
}

export default ShareDrawer;
