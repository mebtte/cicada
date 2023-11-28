import { HtmlHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import capitalize from '@/style/capitalize';
import { CSSVariable } from '../global_style';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;
const Tab = styled.div<{ active: boolean }>`
  transition: 300ms;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  > .label {
    padding: 8px 0 5px 0;

    font-weight: bold;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    transition: inherit;
    ${capitalize}
  }

  > .indicator {
    height: 3px;

    transform-origin: left;
    transition: inherit;
  }

  ${({ active }) => css`
    > .label {
      color: ${active
        ? CSSVariable.COLOR_PRIMARY
        : CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .indicator {
      background-color: ${active ? CSSVariable.COLOR_PRIMARY : 'transparent'};
      transform: scaleX(${active ? 1 : 0});
    }
  `}
`;

function TabList<TabType extends string>({
  current,
  tabList,
  onChange,
  ...props
}: Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> & {
  current: TabType;
  tabList: {
    tab: TabType;
    label: string;
  }[];
  onChange: (tab: TabType) => void;
}) {
  return (
    <Style {...props}>
      {tabList.map(({ tab, label }) => (
        <Tab key={tab} active={tab === current} onClick={() => onChange(tab)}>
          <div className="label">{label}</div>
          <div className="indicator" />
        </Tab>
      ))}
    </Style>
  );
}

export default TabList;
