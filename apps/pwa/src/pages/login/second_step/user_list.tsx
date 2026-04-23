import { Divider, Select } from '@/components_next';
import { getSelectedServer, useServer } from '@/global_states/server';
import { t } from '@/i18n';
import { useMemo } from 'react';

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
        <Divider label={t('or')} />
      </>
    );
  }

  return null;
}

export default UserList;
