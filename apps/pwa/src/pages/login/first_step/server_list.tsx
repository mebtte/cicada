import server from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import { useMemo } from 'react';
import styled from 'styled-components';
import Label from '@/components/label';
import Select from '@/components/select';

const Style = styled.div`
  > .divider {
    margin-top: 20px;

    display: flex;
    align-items: center;
    gap: 10px;

    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};

    > .line {
      flex: 1;
      min-width: 0;

      height: 1px;
      background-color: ${CSSVariable.COLOR_BORDER};
    }
  }
`;

function ServerList({
  disabled,
  toNext,
}: {
  disabled: boolean;
  toNext: () => void;
}) {
  const serverList = useMemo(() => server.get().serverList, []);

  if (serverList) {
    return (
      <Style>
        <Label label={t('existed_server')}>
          <Select
            disabled={disabled}
            options={serverList.map((s) => ({
              label: `${s.hostname} - ${s.origin}`,
              value: s.origin,
            }))}
            onChange={(option) => {
              server.set((ss) => ({
                ...ss,
                selectedServerOrigin: option.value,
              }));
              return toNext();
            }}
          />
        </Label>
        <div className="divider">
          <div className="line" />
          {t('or')}
          <div className="line" />
        </div>
      </Style>
    );
  }
  return null;
}

export default ServerList;
