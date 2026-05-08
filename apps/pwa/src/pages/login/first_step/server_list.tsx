import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import styled from 'styled-components';
import { useServer } from '@/global_states/server';
import dialog from '@/utils/dialog';
import { Divider } from '@/components';
import { FONT, ServerCardItem } from './server_card';
import definition from '@/definition';
import { isSameMajorVersion } from '@/utils/version';
import { useState } from 'react';
import logger from '@/utils/logger';

const Style = styled.div`
  > .label {
    font-family: ${FONT};
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: capitalize;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    margin-bottom: 10px;
  }

  > .server-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 216px;
    overflow-y: auto;
    padding-right: 2px;
    padding-bottom: 4px;
  }

  > .divider {
    margin-top: 20px;
  }
`;

function ServerList({
  disabled,
  toNext,
}: {
  disabled: boolean;
  toNext: () => void;
}) {
  const { serverList } = useServer();
  const [checkingOrigin, setCheckingOrigin] = useState<string>();

  if (!serverList.length) return null;

  return (
    <Style>
      <div className="label">{t('existing_server')}</div>
      <div className="server-items">
        {serverList.map((s) => (
          <ServerCardItem
            key={s.origin}
            hostname={s.hostname}
            origin={s.origin}
            users={s.users}
            selectedUserId={s.selectedUserId}
            onClick={async () => {
              if (disabled || checkingOrigin) return;

              setCheckingOrigin(s.origin);
              try {
                const { default: getMetadata } = await import(
                  '@/server/base/get_metadata'
                );
                const metadata = await getMetadata(s.origin);
                if (!isSameMajorVersion(definition.VERSION, metadata.version)) {
                  dialog.alert({
                    content: t(
                      'server_major_version_mismatch',
                      definition.VERSION,
                      metadata.version,
                    ),
                  });
                  return;
                }
                useServer.setState((server) => ({
                  selectedServerOrigin: s.origin,
                  serverList: server.serverList.map((item) =>
                    item.origin === s.origin
                      ? {
                          ...item,
                          version: metadata.version,
                          hostname: metadata.hostname,
                        }
                      : item,
                  ),
                }));
                toNext();
              } catch (error) {
                logger.error(
                  error,
                  `Failed to get origin "${s.origin}" metadata`,
                );
                dialog.alert({ content: t('failed_to_get_server_metadata') });
              } finally {
                setCheckingOrigin(undefined);
              }
            }}
            onDelete={(e) => {
              e.stopPropagation();
              dialog.confirm({
                content: t('delete_origin_question'),
                onConfirm: () =>
                  useServer.setState((server) => ({
                    serverList: server.serverList.filter(
                      (is) => is.origin !== s.origin,
                    ),
                  })),
              });
            }}
          />
        ))}
      </div>
      <div className="divider">
        <Divider label={t('or')} />
      </div>
    </Style>
  );
}

export default ServerList;
