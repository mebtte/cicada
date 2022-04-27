import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import Icon, { Name } from '@/components/icon';
import { Tab as TabType, TABS, TAB_MAP } from './constant';

const Style = styled.div`
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
`;
const Tab = styled.div<{ active: boolean }>`
  margin-right: 20px;
  cursor: pointer;
  position: relative;
  padding: 8px 0;
  transition: all 300ms;
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 3px;
    bottom: 1px;
    left: 0;
    transition: all 300ms;
    transform-origin: left;
    background-color: rgb(49 194 124);
  }
  > .icon {
    vertical-align: middle;
  }
  > .text {
    font-size: 14px;
    margin-left: 10px;
    vertical-align: middle;
  }
  ${({ active }) => css`
    color: ${active ? 'rgb(49 194 124)' : 'rgb(55 55 55)'};
    &::after {
      transform: scaleX(${active ? 1 : 0});
    }
  `}
`;
const ICON_SIZE = 16;
const TAB_MAP_ICON: Record<TabType, ReactNode> = {
  [TabType.PLAYLIST]: (
    <Icon className="icon" name={Name.LIST_OUTLINE} size={ICON_SIZE} />
  ),
  [TabType.PLAYQUEUE]: (
    <Icon className="icon" name={Name.ORDERED_LIST_OUTLINE} size={ICON_SIZE} />
  ),
};

const Wrapper = ({
  tab,
  onChange,
}: {
  tab: TabType;
  onChange: (tab: TabType) => void;
}) => (
  <Style>
    {TABS.map((t) => {
      const active = t === tab;
      return (
        <Tab key={t} active={active} onClick={() => onChange(t)}>
          {TAB_MAP_ICON[t]}
          <span className="text">{TAB_MAP[t].label}</span>
        </Tab>
      );
    })}
  </Style>
);

export default Wrapper;
