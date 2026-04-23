import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { MdDeleteOutline } from 'react-icons/md';
import { type User } from '@/constants/server';

export const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

export const MAX_AVATARS = 8;

// ─── Card ────────────────────────────────────────────────────────────────────

export const ServerCard = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px 12px 14px;
  border: 2px solid rgb(220 220 220);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 0 rgb(210 210 210);
  cursor: pointer;
  transition: border-color 120ms, box-shadow 80ms, transform 80ms;

  &:hover {
    border-color: ${CSSVariable.COLOR_PRIMARY};
    box-shadow: 0 4px 0 rgb(30 150 100);
  }

  &:active {
    box-shadow: 0 1px 0 rgb(210 210 210);
    transform: translateY(3px);
  }

  > .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    > .hostname {
      font-family: ${FONT};
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      font-weight: 700;
      color: rgb(50 50 50);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > .origin {
      font-family: ${FONT};
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
      font-weight: 600;
      color: rgb(155 155 155);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > .users {
      display: flex;
      align-items: center;
      margin-top: 6px;
    }
  }
`;

// ─── Delete button ────────────────────────────────────────────────────────────

export const DeleteButton = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: 2px solid rgb(240 210 210);
  border-radius: 10px;
  background: rgb(255 245 245);
  box-shadow: 0 3px 0 rgb(230 200 200);
  color: ${CSSVariable.COLOR_DANGEROUS};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 120ms, border-color 120ms, box-shadow 80ms, transform 80ms;

  &:hover {
    background: rgb(255 230 230);
    border-color: rgb(242 80 66);
  }

  &:active {
    box-shadow: 0 1px 0 rgb(230 200 200);
    transform: translateY(2px);
  }

  > svg {
    font-size: 16px;
  }
`;

// ─── Avatars ──────────────────────────────────────────────────────────────────

const avatarBase = `
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #fff;
  flex-shrink: 0;

  &:not(:first-child) {
    margin-left: -6px;
  }
`;

const UserAvatarImg = styled.img`
  ${avatarBase}
  object-fit: cover;
`;

const UserAvatarFallback = styled.div<{ $selected: boolean }>`
  ${avatarBase}
  background: ${({ $selected }) =>
    $selected ? CSSVariable.COLOR_PRIMARY : 'rgb(200 200 200)'};
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
  height: 22px;
  padding: 0 6px;
  margin-left: -6px;
  border-radius: 11px;
  border: 2px solid #fff;
  flex-shrink: 0;
  background: ${CSSVariable.COLOR_PRIMARY};
  color: #fff;
  font-family: ${FONT};
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.02em;
`;

function UserAvatar({ user, selected }: { user: User; selected: boolean }) {
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
    <UserAvatarFallback $selected={selected} title={user.nickname}>
      {user.nickname[0]}
    </UserAvatarFallback>
  );
}

export function UserAvatars({
  users,
  selectedUserId,
}: {
  users: User[];
  selectedUserId?: string;
}) {
  if (!users.length) return null;
  const sorted = selectedUserId
    ? [
        ...users.filter((u) => u.id === selectedUserId),
        ...users.filter((u) => u.id !== selectedUserId),
      ]
    : users;
  const shown = sorted.slice(0, MAX_AVATARS);
  const overflow = sorted.length - MAX_AVATARS;
  return (
    <>
      {shown.map((u) => (
        <UserAvatar key={u.id} user={u} selected={u.id === selectedUserId} />
      ))}
      {overflow > 0 && <OverflowBadge>+{overflow}</OverflowBadge>}
    </>
  );
}

// ─── Composed card ────────────────────────────────────────────────────────────

export function ServerCardItem({
  hostname,
  origin,
  users,
  selectedUserId,
  onClick,
  onDelete,
}: {
  hostname: string;
  origin: string;
  users: User[];
  selectedUserId?: string;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <ServerCard onClick={onClick}>
      <div className="info">
        <span className="hostname">{hostname}</span>
        <span className="origin">{origin}</span>
        {users.length > 0 && (
          <div className="users">
            <UserAvatars users={users} selectedUserId={selectedUserId} />
          </div>
        )}
      </div>
      <DeleteButton onClick={onDelete}>
        <MdDeleteOutline />
      </DeleteButton>
    </ServerCard>
  );
}
