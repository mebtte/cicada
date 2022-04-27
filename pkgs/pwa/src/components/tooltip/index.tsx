import React, { useCallback } from 'react';
import styled, { css } from 'styled-components';
import Tippy from '@tippyjs/react/headless';
import { useSpring, animated } from 'react-spring';

import { Placement } from './constant';

const BACKGROUND_COLOR = 'rgb(0 0 0 / 0.75)';
const SPRING_CONFIG = { tension: 300, friction: 15 };
const TARGET_SPRING = { opacity: 1, transform: 'translate(0%, 0%)' };
const PLACEMENT_MAP_OPTION = {
  [Placement.LEFT]: {
    spring: {
      opacity: 0,
      transform: 'translate(-50%, 0%)',
    },
    css: css`
      top: calc(50% - 4px);
      left: 100%;
      border-color: transparent transparent transparent ${BACKGROUND_COLOR};
    `,
  },
  [Placement.TOP]: {
    spring: {
      opacity: 0,
      transform: 'translate(0%, -50%)',
    },
    css: css`
      left: calc(50% - 4px);
      top: 100%;
      border-color: ${BACKGROUND_COLOR} transparent transparent transparent;
    `,
  },
  [Placement.BOTTOM]: {
    spring: {
      opacity: 0,
      transform: 'translate(0%, 50%)',
    },
    css: css`
      left: calc(50% - 4px);
      bottom: 100%;
      border-color: transparent transparent ${BACKGROUND_COLOR} transparent;
    `,
  },
  [Placement.RIGHT]: {
    spring: {
      opacity: 0,
      transform: 'translate(50%, 0%)',
    },
    css: css`
      top: calc(50% - 4px);
      right: 100%;
      border-color: transparent ${BACKGROUND_COLOR} transparent transparent;
    `,
  },
};
const Message = styled(animated.div)<{
  placement: Placement;
}>`
  border-radius: 4px;
  position: relative;
  padding: 4px 8px;
  font-size: 12px;
  color: #fff;
  background-color: ${BACKGROUND_COLOR};
  font-weight: lighter;
  &::after {
    content: '';
    position: absolute;
    border-width: 4px;
    border-style: solid;
  }
  ${({ placement }) => css`
    &::after {
      ${PLACEMENT_MAP_OPTION[placement].css}
    }
  `}
`;

const Tooltip = ({
  title,
  placement = Placement.TOP,
  children,
}: {
  /** 展示的内容 */
  title: string;
  /** 位置 */
  placement?: Placement;
  children: React.ReactElement<any>;
}) => {
  const option = PLACEMENT_MAP_OPTION[placement];
  const [spring, setSpring] = useSpring(() => option.spring);
  const onShow = useCallback(
    () =>
      void setSpring({
        ...TARGET_SPRING,
        config: { ...SPRING_CONFIG, clamp: false },
      }),
    [setSpring],
  );
  const onHide = useCallback(
    ({ unmount }) =>
      void setSpring({
        ...option.spring,
        config: { ...SPRING_CONFIG, clamp: true },
        onRest: unmount,
      }),
    [setSpring, option],
  );
  return (
    <Tippy
      placement={placement}
      render={(attrs) => (
        <Message placement={placement} style={spring} {...attrs}>
          {title}
        </Message>
      )}
      animation
      onShow={onShow}
      onHide={onHide}
    >
      {children}
    </Tippy>
  );
};

export { Placement };
export default Tooltip;
