import server from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import Label from '@/components/label';
import { Select } from '@/components/select';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import ManageDrawer from './manage_drawer';

const Style = styled.div`
  > .divider {
    margin-top: 20px;

    display: flex;
    align-items: center;
    gap: 10px;

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
  }
`;
const Addon = styled.span`
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  cursor: pointer;
  ${upperCaseFirstLetter}

  &:hover {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }
`;
const getServerList = () => server.get().serverList;

function ServerList({
  disabled,
  toNext,
}: {
  disabled: boolean;
  toNext: () => void;
}) {
  const [serverList, setServerList] = useState(getServerList);
  const [manageDrawerOpen, setManageDrawerOpen] = useState(false);
  const onManageDrawerClose = useCallback(() => {
    setManageDrawerOpen(false);
    return window.setTimeout(() => setServerList(getServerList), 1000);
  }, []);

  if (serverList.length) {
    return (
      <>
        <Style>
          <Label
            label={t('existing_server')}
            addon={
              <Addon
                onClick={(event) => {
                  event.preventDefault();
                  return setManageDrawerOpen(true);
                }}
              >
                {t('manage')}
              </Addon>
            }
          >
            <Select
              disabled={disabled}
              options={serverList.map((s) => ({
                label: `${s.hostname} - ${s.origin}`,
                value: s.origin,
                actualValue: s.origin,
              }))}
              onChange={(option) => {
                server.set((ss) => ({
                  ...ss,
                  selectedServerOrigin: option.actualValue,
                }));
                return toNext();
              }}
            />
          </Label>
          <div className="divider">
            <div className="line" />
            <span className="or">{t('or')}</span>
            <div className="line" />
          </div>
        </Style>
        <ManageDrawer open={manageDrawerOpen} onClose={onManageDrawerClose} />
      </>
    );
  }
  return null;
}

export default ServerList;
