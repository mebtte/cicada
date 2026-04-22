import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Select } from '@/components_next';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import ManageDrawer from './manage_drawer';
import { useServer } from '@/global_states/server';

const Style = styled.div`
  > .select-wrapper {
    position: relative;

    > .server-select {
      > label {
        display: flex;
        align-items: center;
        min-height: 20px;
        padding-right: 48px;
      }
    }

    > .manage-button {
      position: absolute;
      top: 0;
      right: 0;
      display: inline-flex;
      align-items: center;
      height: 20px;
      z-index: 1;
    }
  }

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
const Addon = styled.button`
  padding: 0;
  border: none;
  background: transparent;

  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  cursor: pointer;
  ${upperCaseFirstLetter}

  &:hover {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    opacity: 0.5;
  }
`;
const getServerList = () => useServer.getState().serverList;

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
          <div className="select-wrapper">
            <Select
              className="server-select"
              label={t('existing_server')}
              disabled={disabled}
              options={serverList.map((s) => ({
                label: `${s.hostname} - ${s.origin}`,
                value: s.origin,
              }))}
              onChange={(value) => {
                useServer.setState({ selectedServerOrigin: value });
                return toNext();
              }}
            />
            <Addon
              className="manage-button"
              disabled={disabled}
              onClick={() => setManageDrawerOpen(true)}
            >
              {t('manage')}
            </Addon>
          </div>
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
