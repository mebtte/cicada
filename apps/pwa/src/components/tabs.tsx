import {
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { animated, useSpring } from '@react-spring/web';
import styled, { css } from 'styled-components';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from './theme';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const HOVER_SHADOW = CSSVariable.COLOR_DISABLED_SHADOW;

export type TabItem<TabType extends string> = {
  tab: TabType;
  label: ReactNode;
  disabled?: boolean;
};

export type TabPanel<TabType extends string> = {
  tab: TabType;
  content: ReactNode;
};

const TabListRoot = styled.div`
  position: relative;

  min-width: 0;
  padding: 4px;

  display: flex;
  align-items: stretch;
  gap: 4px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};
`;

const ActiveBlock = styled.div<{
  $leftOffset: number;
  $leftPercent: number;
  $widthOffset: number;
  $widthPercent: number;
}>`
  position: absolute;
  top: 4px;
  left: calc(
    ${({ $leftPercent }) => $leftPercent}% + ${({ $leftOffset }) =>
        $leftOffset}px
  );
  bottom: 4px;
  z-index: 0;

  width: calc(
    ${({ $widthPercent }) => $widthPercent}% - ${({ $widthOffset }) =>
        $widthOffset}px
  );
  background: ${PRIMARY};
  border: 2px solid ${PRIMARY_SHADOW};
  border-radius: 12px;
  transition: left 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  pointer-events: none;
`;

const TabButton = styled.button<{ $active: boolean }>`
  position: relative;
  z-index: 1;
  isolation: isolate;
  flex: 1 1 0;
  min-width: 0;
  height: 34px;
  padding: 0 12px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 0;
  border-radius: 12px;
  background: transparent;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  font-weight: 800;
  letter-spacing: 0;
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  transition:
    color 150ms ease-out,
    filter 120ms ease-out;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border: 2px solid ${HOVER_SHADOW};
    border-radius: 12px;
    background: #fff;
    opacity: 0;
    transition: opacity 120ms ease-out;
    pointer-events: none;
  }

  &:not(:disabled):hover {
    filter: brightness(1.04);
  }

  &:disabled {
    cursor: not-allowed;
    color: ${CSSVariable.TEXT_COLOR_DISABLED};
  }

  &:focus-visible {
    outline: 3px solid ${PRIMARY};
    outline-offset: 2px;
  }

  ${({ $active }) =>
    $active &&
    css`
      color: #fff;
    `}

  ${({ $active }) =>
    !$active &&
    css`
      &:not(:disabled):hover {
        &::before {
          opacity: 1;
        }
      }
    `}
`;

const PanelsRoot = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const PanelRoot = styled(animated.div)<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
  visibility: ${({ $active }) => ($active ? 'visible' : 'hidden')};
  transition: visibility 0s linear ${({ $active }) => ($active ? '0s' : '220ms')};
`;

export function TabList<TabType extends string>({
  current,
  tabList,
  onChange,
  style,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  current: TabType;
  tabList: TabItem<TabType>[];
  onChange: (tab: TabType) => void;
}) {
  const activeIndex = Math.max(
    tabList.findIndex(({ tab }) => tab === current),
    0,
  );
  const tabCount = Math.max(tabList.length, 1);
  const activeGapTotal = (tabCount - 1) * 4;
  const activeWidthPercent = 100 / tabCount;
  const activeWidthOffset = (8 + activeGapTotal) / tabCount;

  return (
    <TabListRoot
      role="tablist"
      style={style}
      {...props}
    >
      <ActiveBlock
        $leftPercent={activeIndex * activeWidthPercent}
        $leftOffset={4 + activeIndex * (4 - activeWidthOffset)}
        $widthPercent={activeWidthPercent}
        $widthOffset={activeWidthOffset}
      />
      {tabList.map(({ tab, label, disabled }) => {
        const active = tab === current;
        return (
          <TabButton
            key={tab}
            role="tab"
            type="button"
            $active={active}
            aria-selected={active}
            disabled={disabled}
            onClick={() => {
              if (!disabled && !active) {
                onChange(tab);
              }
            }}
          >
            {label}
          </TabButton>
        );
      })}
    </TabListRoot>
  );
}

function AnimatedPanel({
  active,
  direction,
  children,
}: {
  active: boolean;
  direction: number;
  children: ReactNode;
}) {
  const style = useSpring({
    opacity: active ? 1 : 0,
    transform: active
      ? 'translate3d(0, 0, 0) scale(1)'
      : `translate3d(${direction * -22}px, 0, 0) scale(0.985)`,
    config: {
      tension: 360,
      friction: 34,
    },
  });

  return (
    <PanelRoot $active={active} style={style} aria-hidden={!active}>
      {children}
    </PanelRoot>
  );
}

export function TabPanels<TabType extends string>({
  current,
  tabList,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  current: TabType;
  tabList: TabPanel<TabType>[];
}) {
  const [mountedTabs, setMountedTabs] = useState<Set<TabType>>(
    () => new Set([current]),
  );
  const activeIndex = Math.max(
    tabList.findIndex(({ tab }) => tab === current),
    0,
  );
  const previousIndexRef = useRef(activeIndex);
  const direction =
    activeIndex === previousIndexRef.current
      ? 1
      : activeIndex > previousIndexRef.current
        ? 1
        : -1;
  const renderedTabs = mountedTabs.has(current)
    ? mountedTabs
    : new Set(mountedTabs).add(current);

  useEffect(() => {
    previousIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    setMountedTabs((tabs) => {
      if (tabs.has(current)) {
        return tabs;
      }

      return new Set(tabs).add(current);
    });
  }, [current]);

  return (
    <PanelsRoot {...props}>
      {tabList.map(({ tab, content }) =>
        renderedTabs.has(tab) ? (
          <AnimatedPanel
            key={tab}
            active={tab === current}
            direction={direction}
          >
            {content}
          </AnimatedPanel>
        ) : null,
      )}
    </PanelsRoot>
  );
}
