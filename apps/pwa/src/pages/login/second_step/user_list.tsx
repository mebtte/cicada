import { Divider } from '@/components';
import { CSSVariable } from '@/global_style';
import { getSelectedServer, useServer } from '@/global_states/server';
import { t } from '@/i18n';
import getResizedImage from '@/server/asset/get_resized_image';
import { useMemo } from 'react';
import styled from 'styled-components';

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
    padding-inline: 2px;
    padding-bottom: 4px;
  }

  > .divider {
    margin-top: 20px;
  }
`;

const UserItem = styled.button`
  appearance: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 96px;
  min-width: 96px;
  padding: 14px 10px 12px;
  border: 2px solid rgb(210 210 210);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 4px 0 rgb(210 210 210);
  cursor: pointer;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
  transition:
    border-color 120ms,
    box-shadow 80ms,
    transform 80ms,
    background 120ms;

  &:hover {
    border-color: rgb(30 150 100);
    box-shadow: 0 4px 0 rgb(30 150 100);
  }

  &:hover > .avatar,
  &:focus-visible > .avatar {
    border-color: rgb(30 150 100);
    box-shadow: 0 4px 0 rgb(30 150 100);
  }

  &:active {
    box-shadow: 0 1px 0 rgb(210 210 210);
    transform: translateY(3px);
  }

  &:focus-visible {
    outline: 3px solid rgb(44 182 125 / 0.2);
    outline-offset: 3px;
  }

  > .avatar {
    width: 58px;
    height: 58px;
    border-radius: 16px;
    border: 2px solid ${CSSVariable.COLOR_CONTROL_NEUTRAL};
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
    box-shadow: 0 4px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL};
    transition: border-color 120ms, box-shadow 80ms;

    > img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  > .name {
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
