import Label from '@/components/label';
import { Select } from '@/components/select';
import server, { getSelectedServer } from '@/global_states/server';
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
    () => getSelectedServer(server.get())?.users || [],
    [],
  );

  if (userList.length) {
    return (
      <>
        <Label label={t('existing_user')}>
          <Select
            options={userList.map((u) => ({
              label: `${u.nickname}(@${u.username})`,
              value: u.id,
              actualValue: u.id,
            }))}
            onChange={(option) => {
              server.set((ss) => ({
                ...ss,
                serverList: ss.serverList.map((s) =>
                  s.origin === getSelectedServer(server.get())!.origin
                    ? {
                        ...s,
                        selectedUserId: option.actualValue,
                      }
                    : s,
                ),
              }));
              return window.setTimeout(redirect, 0);
            }}
          />
        </Label>
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
