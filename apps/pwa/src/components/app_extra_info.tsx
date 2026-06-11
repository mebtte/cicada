import definition from '@/definition';
import { useSelectedServer } from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

const Style = styled.section`
  flex: 0 0 auto;
  margin-top: auto;
  overflow: hidden;

  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 5px 0 ${CSSVariable.COLOR_BORDER};

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  tbody > tr:not(:first-child) > th,
  tbody > tr:not(:first-child) > td {
    border-top: 2px solid ${CSSVariable.COLOR_BORDER};
  }
`;

const LabelCell = styled.th`
  width: 50%;
  padding: 11px 12px 13px 14px;
  vertical-align: middle;
  text-align: right;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-weight: 800;
  line-height: 1.25;
  text-transform: capitalize;

  ${({ theme: { miniMode } }) =>
    miniMode &&
    css`
      padding: 10px 12px 12px;
    `}
`;

const ValueCell = styled.td`
  width: 50%;
  min-width: 0;
  padding: 11px 14px 13px 12px;
  vertical-align: middle;
  text-align: left;

  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-weight: 800;
  line-height: 1.25;

  ${({ theme: { miniMode } }) =>
    miniMode &&
    css`
      padding: 10px 12px 12px;
    `}
`;

const ValueText = styled.span`
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

function AppExtraInfo(props: HTMLAttributes<HTMLElement>) {
  const selectedServer = useSelectedServer()!;

  return (
    <Style {...props}>
      <Table>
        <tbody>
          <tr>
            <LabelCell>{t('pwa_version')}</LabelCell>
            <ValueCell>
              <ValueText title={definition.VERSION}>
                {definition.VERSION}
              </ValueText>
            </ValueCell>
          </tr>
          <tr>
            <LabelCell>{t('server_version')}</LabelCell>
            <ValueCell>
              <ValueText title={selectedServer.version}>
                {selectedServer.version}
              </ValueText>
            </ValueCell>
          </tr>
          <tr>
            <LabelCell>{t('server_name')}</LabelCell>
            <ValueCell>
              <ValueText title={selectedServer.hostname}>
                {selectedServer.hostname}
              </ValueText>
            </ValueCell>
          </tr>
          <tr>
            <LabelCell>{t('server_address')}</LabelCell>
            <ValueCell>
              <ValueText title={selectedServer.origin}>
                {selectedServer.origin}
              </ValueText>
            </ValueCell>
          </tr>
        </tbody>
      </Table>
    </Style>
  );
}

export default AppExtraInfo;
