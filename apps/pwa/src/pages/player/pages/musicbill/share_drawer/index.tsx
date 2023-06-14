import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import styled from 'styled-components';
import useNavigate from '@/utils/use_navigate';
import p from '@/global_states/profile';
import Button, { Variant } from '@/components/button';
import dialog from '@/utils/dialog';
import notice from '@/utils/notice';
import addMusicbillSharedUser from '@/server/api/add_musicbill_shared_user';
import logger from '@/utils/logger';
import { EMAIL } from '#/constants/regexp';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { CSSVariable } from '@/global_style';
import User from './user';
import { Musicbill, ZIndex } from '../../../constants';
import useOpen from './use_open';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { quitSharedMusicbill } from '../utils';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.DRAWER,
  },
};
const bodyProps: { style: CSSProperties } = {
  style: {
    width: 300,
    overflow: 'auto',
  },
};
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

function ShareDrawer({ musicbill }: { musicbill: Musicbill }) {
  const navigate = useNavigate();
  const profile = p.useState()!;
  const { open, onClose } = useOpen();

  const owned = musicbill.owner.id === profile.id;
  return (
    <Drawer
      maskProps={maskProps}
      bodyProps={bodyProps}
      open={open}
      onClose={onClose}
    >
      <Title>共享用户</Title>
      <UserList>
        <User
          user={musicbill.owner}
          owner
          accepted
          musicbillId={musicbill.id}
          onClose={onClose}
        />
        {musicbill.sharedUserList.map((u) => (
          <User
            key={u.id}
            user={u}
            accepted={u.accepted}
            deletable={owned}
            musicbillId={musicbill.id}
            onClose={onClose}
          />
        ))}
      </UserList>
      <Button
        variant={Variant.PRIMARY}
        style={actionStyle}
        onClick={() =>
          dialog.input({
            label: '邮箱',
            confirmVariant: Variant.PRIMARY,
            confirmText: '邀请',
            onConfirm: async (email) => {
              if (!email || !EMAIL.test(email)) {
                notice.error('请输入合法的邮箱');
                return false;
              }

              try {
                await addMusicbillSharedUser({
                  musicbillId: musicbill.id,
                  email,
                });
                notice.info('已发出邀请');
                playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
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
    </Drawer>
  );
}

export default ShareDrawer;
