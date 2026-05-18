import { useEffect } from 'react';
import styled from 'styled-components';
import { MdDeleteOutline } from 'react-icons/md';
import { useServer } from '@/global_states/server';
import { User } from '@/constants/server';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #fff;
  border: 2px solid rgb(220 220 220);
  border-radius: 16px;
  box-shadow: 0 4px 0 rgb(210 210 210);
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgb(44 182 125);
  color: #fff;
  font-family: ${FONT};
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: -0.5px;
  text-transform: uppercase;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;

  > .name {
    font-family: ${FONT};
    font-size: 15px;
    font-weight: 700;
    color: rgb(50 50 50);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > .origin {
    font-family: ${FONT};
    font-size: 12px;
    font-weight: 600;
    color: rgb(155 155 155);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
  }

  > .user-avatars {
    margin-top: 6px;
  }
`;

const DeleteButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: rgb(255 240 240);
  color: #f25042;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms;

  &:hover {
    background: rgb(255 220 220);
  }

  &:active {
    background: rgb(255 200 200);
  }

  > svg {
    font-size: 18px;
  }
`;

const MAX_AVATARS = 4;

const AvatarStack = styled.div`
  display: flex;
  align-items: center;
`;

const avatarBase = `
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #fff;
  flex-shrink: 0;

  &:not(:first-child) {
    margin-left: -7px;
  }
`;

const UserAvatarImg = styled.img`
  ${avatarBase}
  object-fit: cover;
`;

const UserAvatarFallback = styled.div`
  ${avatarBase}
  background: rgb(44 182 125);
  color: #fff;
  font-family: ${FONT};
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
`;

const OverflowBadge = styled.div`
  ${avatarBase}
  background: rgb(230 230 230);
  color: rgb(110 110 110);
  font-family: ${FONT};
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function UserAvatar({ user }: { user: User }) {
  if (user.avatar) {
    return (
      <UserAvatarImg
        src={`${user.avatar}?size=44`}
        alt={user.nickname}
        title={user.nickname}
      />
    );
  }
  return (
    <UserAvatarFallback title={user.nickname}>
      {user.nickname[0]}
    </UserAvatarFallback>
  );
}

function UserAvatars({ users }: { users: User[] }) {
  if (!users.length) {
    return null;
  }
  const shown = users.slice(0, MAX_AVATARS);
  const overflow = users.length - MAX_AVATARS;
  return (
    <AvatarStack>
      {shown.map((u) => (
        <UserAvatar key={u.id} user={u} />
      ))}
      {overflow > 0 && <OverflowBadge>+{overflow}</OverflowBadge>}
    </AvatarStack>
  );
}

function getInitials(hostname: string) {
  const parts = hostname.split(/[\s\-._ ]+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return hostname.slice(0, 2);
}

function ManageContent({ onEmpty }: { onEmpty?: () => void }) {
  const { serverList } = useServer();

  useEffect(() => {
    if (!serverList.length && onEmpty) {
      onEmpty();
    }
  }, [onEmpty, serverList.length]);

  return (
    <List>
      {serverList.map((s) => (
        <Card key={s.origin}>
          <Avatar>{getInitials(s.hostname)}</Avatar>
          <Info>
            <div className="name">{s.hostname}</div>
            <div className="origin">{s.origin}</div>
            <div className="user-avatars">
              <UserAvatars users={s.users} />
            </div>
          </Info>
          <DeleteButton
            onClick={() =>
              dialog.confirm({
                content: t('delete_origin_question'),
                confirmVariant: 'danger',
                onConfirm: () =>
                  useServer.setState((server) => ({
                    serverList: server.serverList.filter(
                      (is) => is.origin !== s.origin,
                    ),
                  })),
              })
            }
          >
            <MdDeleteOutline />
          </DeleteButton>
        </Card>
      ))}
    </List>
  );
}

export default ManageContent;
