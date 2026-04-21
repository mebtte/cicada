import { Select } from '@/components_next';
import { getSelectedServer, useServer } from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { useMemo } from 'react';
import styled from 'styled-components';

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;

  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .line {
    flex: 1;
    min-width: 0;
    height: 1px;
    background-color: ${CSSVariable.COLOR_BORDER};
  }

  > .or {
    text-transform: uppercase;
  }
`;

function UserList({ redirect }: { redirect: () => void }) {
  const userList = useMemo(
    () => getSelectedServer(useServer.getState())?.users || [],
    [],
  );

  if (userList.length) {
    return (
      <>
        <Select
          label={t('existing_user')}
          options={userList.map((u) => ({
            label: `${u.nickname}(@${u.username})`,
            value: u.id,
          }))}
          onChange={(value) => {
            useServer.setState((server) => ({
              serverList: server.serverList.map((s) =>
                s.origin === getSelectedServer(server)!.origin
                  ? { ...s, selectedUserId: value }
                  : s,
              ),
            }));
            return window.setTimeout(redirect, 0);
          }}
        />
        <Divider>
          <div className="line" />
          <span className="or">{t('or')}</span>
          <div className="line" />
        </Divider>
      </>
    );
  }

  return null;
}

export default UserList;
