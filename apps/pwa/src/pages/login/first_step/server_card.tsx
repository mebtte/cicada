import styled, { css } from 'styled-components';
import { CSSVariable } from '@/global_style';
import { Delete } from '@/components/icon';
import { type User } from '@/constants/server';
import Spinner from '@/components/spinner';
import Button from '@/components/button';
import { t } from '@/i18n';

export const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

export const MAX_AVATARS = 8;

// ─── Card ────────────────────────────────────────────────────────────────────

export const ServerCard = styled.div<{
  $loading: boolean;
  $disabled: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px 12px 14px;
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  cursor: ${({ $loading, $disabled }) =>
    $loading ? 'progress' : $disabled ? 'not-allowed' : 'pointer'};
  transition: box-shadow 150ms ease-out, transform 150ms ease-out, filter 120ms;

  ${({ $loading, $disabled }) =>
    !$loading &&
    !$disabled &&
    css`
      &:hover {
        box-shadow: 0 6px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
        transform: translateY(-2px);
      }

      &:active {
        box-shadow: none;
        transform: translateY(4px);
      }
    `}

  ${({ $disabled }) =>
    $disabled &&
    css`
      filter: grayscale(1);
      opacity: 0.7;
    `}

  > .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    > .name-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      min-width: 0;

      > .hostname {
        min-width: 0;
        flex: 0 1 auto;
        font-family: ${FONT};
        font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
        font-weight: 700;
        color: rgb(50 50 50);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      > .server-version {
        flex-shrink: 0;
        font-family: ${FONT};
        font-size: ${CSSVariable.TEXT_SIZE_SMALL};
        font-weight: 700;
        color: ${CSSVariable.COLOR_CONTROL_NEUTRAL};
        white-space: nowrap;
      }
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

export const DeleteButton = styled(Button)`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 10px;

  > .btn-label > svg {
    font-size: 16px;
  }
`;

// ─── Avatars ──────────────────────────────────────────────────────────────────

const avatarBase = `
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 2px solid #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};

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
  border-radius: 8px;
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
  box-shadow: 0 2px 0 rgb(30 150 100);
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
  version,
  origin,
  users,
  selectedUserId,
  loading = false,
  disabled = false,
  onClick,
  onDelete,
}: {
  hostname: string;
  version?: string;
  origin: string;
  users: User[];
  selectedUserId?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const inactive = loading || disabled;
  return (
    <ServerCard
      $loading={loading}
      $disabled={disabled}
      onClick={inactive ? undefined : onClick}
      aria-busy={loading || undefined}
      aria-disabled={inactive || undefined}
    >
      <div className="info">
        <span className="name-row">
          <span className="hostname">{hostname}</span>
          {version && <span className="server-version">{version}</span>}
        </span>
        <span className="origin">{origin}</span>
        {users.length > 0 && (
          <div className="users">
            <UserAvatars users={users} selectedUserId={selectedUserId} />
          </div>
        )}
      </div>
      {loading ? (
        <Spinner size={24} style={{ flexShrink: 0, marginInline: 4 }} aria-hidden />
      ) : (
        <DeleteButton
          type="button"
          variant="danger"
          size="sm"
          square
          aria-label={t('delete')}
          onClick={onDelete}
          disabled={disabled}
        >
          <Delete />
        </DeleteButton>
      )}
    </ServerCard>
  );
}
