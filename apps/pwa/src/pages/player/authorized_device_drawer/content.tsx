import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/button';
import Empty from '@/components/empty';
import Spinner from '@/components/spinner';
import { CSSVariable } from '@/global_style';
import day from '@/utils/day';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import getSessions, { AuthSession } from '@/server/api/get_sessions';
import updateSession from '@/server/api/update_session';
import deleteSession from '@/server/api/delete_session';
import { t } from '@/i18n';
import { getDisplayDeviceName } from '@/utils/device_name';

const Body = styled.div`
  flex: 1;
  min-height: 0;
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Status = styled.div`
  flex: 1;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Item = styled.div<{ $current: boolean }>`
  padding: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;

  border: 2px solid
    ${({ $current }) =>
      $current ? CSSVariable.COLOR_PRIMARY : CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 5px 0
    ${({ $current }) =>
      $current ? CSSVariable.COLOR_PRIMARY : CSSVariable.COLOR_BORDER};

  > .main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .header {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .name {
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 800;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    overflow-wrap: anywhere;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 6px 16px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    overflow-wrap: anywhere;

    > div {
      min-width: 0;
      line-height: 1.35;
    }

    .label {
      margin-right: 6px;
      font-weight: 800;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }
  }

  .actions {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;

    .actions {
      align-items: stretch;

      > button {
        flex: 1;
      }
    }
  }
`;

function formatTime(timestamp: number) {
  return day(timestamp).format('YYYY-MM-DD HH:mm');
}

function getSessionDeviceName(session: AuthSession) {
  return (
    getDisplayDeviceName(session.deviceName, session.userAgent) ||
    t('unknown_device')
  );
}

function AuthorizedDeviceContent() {
  const [sessions, setSessions] = useState<AuthSession[] | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setSessions(await getSessions());
    } catch (error) {
      logger.error(error, 'Failed to get authorized devices');
      notice.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const revoke = (session: AuthSession) =>
    dialog.confirm({
      content: t('revoke_authorized_device_question'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteSession(session.id);
          await reload();
        } catch (error) {
          logger.error(error, 'Failed to revoke authorized device');
          notice.error(error.message);
          return false;
        }
      },
    });

  const rename = (session: AuthSession) =>
    dialog.input({
      label: t('device_name'),
      initialValue: getSessionDeviceName(session),
      maxLength: 80,
      confirmVariant: 'primary',
      onConfirm: async (deviceName) => {
        if (!deviceName.trim()) return false;
        try {
          await updateSession({ id: session.id, deviceName: deviceName.trim() });
          await reload();
        } catch (error) {
          logger.error(error, 'Failed to rename authorized device');
          notice.error(error.message);
          return false;
        }
      },
    });

  return (
    <Body>
      {loading && !sessions ? (
        <Status>
          <Spinner />
        </Status>
      ) : null}
      {sessions && sessions.length ? (
        <List>
          {sessions.map((session) => {
            const deviceName = getSessionDeviceName(session);
            return (
              <Item key={session.id} $current={session.current}>
                <div className="main">
                  <div className="header">
                    <div className="name">{deviceName}</div>
                  </div>
                  <div className="meta">
                    <div>
                      <span className="label">{t('last_seen_at')}</span>
                      {formatTime(session.lastSeenTimestamp)}
                    </div>
                    <div>
                      <span className="label">{t('last_seen_ip')}</span>
                      {session.lastSeenIP || t('unknown')}
                    </div>
                    <div>
                      <span className="label">{t('inactive_expire_at')}</span>
                      {formatTime(session.inactiveExpireTimestamp)}
                    </div>
                    <div>
                      <span className="label">{t('created_at')}</span>
                      {formatTime(session.createTimestamp)}
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => rename(session)}
                  >
                    {t('rename')}
                  </Button>
                  {session.current ? null : (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => revoke(session)}
                    >
                      {t('revoke')}
                    </Button>
                  )}
                </div>
              </Item>
            );
          })}
        </List>
      ) : null}
      {sessions && !sessions.length ? <Empty /> : null}
    </Body>
  );
}

export default AuthorizedDeviceContent;
