import Drawer from '@/components/drawer';
import Spinner from '@/components/spinner';
import { CSSProperties } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Button, { Variant } from '@/components/button';
import { MusicbillSharedStatus } from '#/constants';
import dialog from '@/utils/dialog';
import { EMAIL } from '#/constants/regexp';
import notice from '@/utils/notice';
import addMusicbillSharedUser from '@/server/api/add_musicbill_shared_user';
import logger from '@/utils/logger';
import deleteMusicbillSharedUser from '@/server/api/delete_musicbill_shared_user';
import profile from '@/global_states/profile';
import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useSharedUserList from './use_shared_user_list';
import useOpen from './use_open';
import { Musicbill, ZIndex } from '../../../constants';
import User from './user';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.DRAWER,
  },
};
const bodyProps: { style: CSSProperties } = {
  style: {
    width: 250,
    display: 'flex',
    flexDirection: 'column',
  },
};
const Title = styled.div``;
const Container = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;
const BaseContent = styled(animated.div)`
  ${absoluteFullSize}
`;
const CenterdContent = styled(BaseContent)`
  ${flexCenter}
`;
const Content = styled(BaseContent)`
  > .user-list {
    margin: 20px 0;
  }

  > .action {
    display: block;
    margin: 20px;
    width: calc(100% - 40px);
  }
`;

function ShareDrawer({ musicbill }: { musicbill: Musicbill }) {
  const navigate = useNavigate();

  const { open, onClose } = useOpen();
  const { data, reload } = useSharedUserList({ open, id: musicbill.id });

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Drawer
      maskProps={maskProps}
      bodyProps={bodyProps}
      open={open}
      onClose={onClose}
    >
      <Title>共享用户列表</Title>
      <Container>
        {transitions((style, d) => {
          if (d.error) {
            return (
              <CenterdContent style={style}>
                <ErrorCard errorMessage={d.error.message} retry={reload} />
              </CenterdContent>
            );
          }
          if (d.loading) {
            return (
              <CenterdContent style={style}>
                <Spinner />
              </CenterdContent>
            );
          }
          return (
            <Content style={style}>
              <div className="user-list">
                {d.value.map((u) => (
                  <User key={u.id} user={u} onClose={onClose} />
                ))}
              </div>
              <Button
                className="action"
                variant={Variant.PRIMARY}
                onClick={() =>
                  dialog.textInput({
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
                        playerEventemitter.emit(
                          PlayerEventType.FETCH_MUSICBILL_DETAIL,
                          { id: musicbill.id, silence: true },
                        );
                        onClose();
                      } catch (error) {
                        logger.error(error, '乐单邀请共享用户失败');
                        notice.error(error.message);
                        return false;
                      }
                    },
                  })
                }
              >
                邀请用户
              </Button>
              {musicbill.shareStatus === MusicbillSharedStatus.SHARE_TO_ME ? (
                <Button
                  className="action"
                  variant={Variant.DANGER}
                  onClick={() =>
                    dialog.confirm({
                      title: '确定退出共享乐单吗?',
                      onConfirm: async () => {
                        try {
                          await deleteMusicbillSharedUser({
                            musicbillId: musicbill.id,
                            userId: profile.get()!.id,
                          });
                          playerEventemitter.emit(
                            PlayerEventType.RELOAD_MUSICBILL_LIST,
                            null,
                          );
                          navigate({
                            path: ROOT_PATH + PLAYER_PATH.EXPLORATION,
                          });
                        } catch (error) {
                          logger.error(error, '退出共享乐单失败');
                          notice.error(error.message);
                          return false;
                        }
                      },
                    })
                  }
                >
                  退出共享
                </Button>
              ) : null}
            </Content>
          );
        })}
      </Container>
    </Drawer>
  );
}

export default ShareDrawer;
