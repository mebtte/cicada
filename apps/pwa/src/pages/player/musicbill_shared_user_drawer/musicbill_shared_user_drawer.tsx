import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import styled from 'styled-components';
import useNavigate from '@/utils/use_navigate';
import Button, { Variant } from '@/components/button';
import dialog from '@/utils/dialog';
import notice from '@/utils/notice';
import addMusicbillSharedUser from '@/server/api/add_musicbill_shared_user';
import logger from '@/utils/logger';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { USERNAME_MAX_LENGTH } from '#/constants/user';
import { useUser } from '@/global_states/server';
import User from './user';
import { Musicbill } from '../constants';
import e, { EventType } from '../eventemitter';
import { quitSharedMusicbill } from '../pages/musicbill/utils';
import useDynamicZIndex from '../use_dynamic_z_index';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 300,
  },
};
const Content = styled.div`
  height: 100%;

  overflow: auto;
  ${autoScrollbar}
`;
const actionStyle: CSSProperties = {
  display: 'block',
  margin: '10px 20px',
  width: 'calc(100% - 40px)',
};
const Title = styled.div`
  margin: 40px 20px 20px 20px;

  font-weight: bold;
  font-size: 16px;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
`;
const UserList = styled.div``;

function ShareDrawer({
  open,
  onClose,
  musicbill,
}: {
  open: boolean;
  onClose: () => void;
  musicbill: Musicbill;
}) {
  const zIndex = useDynamicZIndex(EventType.OPEN_MUSICBILL_SHARED_USER_DRAWER);

  const navigate = useNavigate();
  const user = useUser()!;

  const owned = musicbill.owner.id === user.id;
  return (
    <Drawer
      maskProps={{
        style: {
          zIndex,
        },
      }}
      bodyProps={bodyProps}
      open={open}
      onClose={onClose}
    >
      <Content>
        <Title>{t('shared_user')}</Title>
        <UserList>
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
              musicbillId={musicbill.id}
            />
          ))}
        </UserList>
        <Button
          variant={Variant.PRIMARY}
          style={actionStyle}
          onClick={() =>
            dialog.input({
              label: t('username'),
              maxLength: USERNAME_MAX_LENGTH,
              confirmVariant: Variant.PRIMARY,
              confirmText: t('invite'),
              onConfirm: async (username) => {
                if (!username.length || username.length > USERNAME_MAX_LENGTH) {
                  notice.error(t('username_is_invalid'));
                  return false;
                }

                try {
                  await addMusicbillSharedUser({
                    musicbillId: musicbill.id,
                    username,
                  });
                  notice.info(t('invitation_has_been_sent'));
                  e.emit(EventType.RELOAD_MUSICBILL, {
                    id: musicbill.id,
                    silence: true,
                  });
                } catch (error) {
                  logger.error(error, 'Fail to invite shared user');
                  notice.error(error.message);
                  return false;
                }
              },
            })
          }
        >
          邀请用户
        </Button>
        {owned ? null : (
          <Button
            variant={Variant.DANGER}
            style={actionStyle}
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
            退出共享
          </Button>
        )}
      </Content>
    </Drawer>
  );
}

export default ShareDrawer;
