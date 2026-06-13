import { Divider } from '@/components';
import { CSSVariable } from '@/global_style';
import { getSelectedServer, useServer } from '@/global_states/server';
import { t } from '@/i18n';
import getResizedImage from '@/server/asset/get_resized_image';
import { useMemo } from 'react';
import styled from 'styled-components';
import Button from '@/components/button';

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const Style = styled.div`
  > .label {
    margin-bottom: 10px;
    font-family: ${FONT};
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: capitalize;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }

  > .user-items {
    display: flex;
    justify-content: center;
    gap: 12px;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 2px 6px;
  }

  > .divider {
    margin-top: 20px;
  }
`;

const UserItem = styled(Button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 96px;
  height: auto;
  min-width: 96px;
  padding: 14px 10px 12px;
  border-radius: 18px;
  text-align: center;
  text-transform: none;

  > .btn-label {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  > .btn-label > .avatar {
    width: 58px;
    height: 58px;
    border-radius: 16px;
    border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    flex-shrink: 0;
    overflow: hidden;
    background: #fff;
    color: ${CSSVariable.COLOR_PRIMARY};
    font-family: ${FONT};
    font-size: 18px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    box-shadow: 0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};

    > img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  > .btn-label > .name {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: rgb(50 50 50);
    font-family: ${FONT};
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
  }
`;

function getUserInitial(nickname: string, username: string) {
  return (nickname || username || '?')[0];
}

function UserList({ redirect }: { redirect: () => void }) {
  const selectedServer = useServer(getSelectedServer);
  const userList = selectedServer?.users || [];
  const selectedUserId = selectedServer?.selectedUserId;
  const sortedUserList = useMemo(() => {
    if (!selectedUserId) {
      return userList;
    }

    const selectedUser = userList.find((u) => u.id === selectedUserId);
    if (!selectedUser) {
      return userList;
    }

    return [selectedUser].concat(userList.filter((u) => u.id !== selectedUserId));
  }, [selectedUserId, userList]);

  if (userList.length) {
    return (
      <Style>
        <div className="label">{t('existing_user')}</div>
        <div className="user-items">
          {sortedUserList.map((user) => {
            return (
              <UserItem
                key={user.id}
                variant="ghost"
                size="md"
                type="button"
                title={user.nickname}
                onClick={() => {
                  useServer.setState((server) => ({
                    serverList: server.serverList.map((s) =>
                      s.origin === selectedServer?.origin
                        ? { ...s, selectedUserId: user.id }
                        : s,
                    ),
                  }));
                  return window.setTimeout(redirect, 0);
                }}
              >
                <div className="avatar">
                  {user.avatar ? (
                    <img
                      src={getResizedImage({
                        url: user.avatar,
                        size: 92,
                      })}
                      alt={user.nickname}
                    />
                  ) : (
                    getUserInitial(user.nickname, user.username)
                  )}
                </div>
                <div className="name">{user.nickname}</div>
              </UserItem>
            );
          })}
        </div>
        <div className="divider">
          <Divider label={t('or')} />
        </div>
      </Style>
    );
  }

  return null;
}

export default UserList;
