import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import styled from 'styled-components';
import { useServer } from '@/global_states/server';
import dialog from '@/utils/dialog';
import { Divider } from '@/components';
import { FONT, ServerCardItem } from './server_card';

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
            onClick={() => {
              if (disabled) return;
              useServer.setState({ selectedServerOrigin: s.origin });
              toNext();
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
