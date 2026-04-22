import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { useState } from 'react';
import styled from 'styled-components';
import { Select } from '@/components_next';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import ManageDrawer from './manage_drawer';
import { useServer } from '@/global_states/server';
import { useTheme } from '@/global_states/theme';

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

function ServerList({
  disabled,
  toNext,
  onManage,
}: {
  disabled: boolean;
  toNext: () => void;
  onManage: () => void;
}) {
  const { serverList } = useServer();
  const { miniMode } = useTheme();
  const [manageDrawerOpen, setManageDrawerOpen] = useState(false);

  const handleManage = () => {
    if (miniMode) {
      onManage();
    } else {
      setManageDrawerOpen(true);
    }
  };

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
              onClick={handleManage}
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
        {!miniMode && (
          <ManageDrawer
            open={manageDrawerOpen}
            onClose={() => setManageDrawerOpen(false)}
          />
        )}
      </>
    );
  }
  return null;
}

export default ServerList;
