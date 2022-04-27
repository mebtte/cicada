import React, { HTMLAttributes, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { useTransition, animated, SpringConfig } from 'react-spring';

import { ZIndex } from '@/constants/style';
import scrollbarNever from '@/style/scrollbar_never';

const TRANSITION = {
  from: {
    opacity: 0,
    transform: 'translate(0, 100%)',
  },
  enter: {
    opacity: 1,
    transform: 'translate(0, 0%)',
  },
  leave: {
    opacity: 0,
    transform: 'translate(0, 100%)',
  },
};

const Mask = styled(animated.div)`
  z-index: ${ZIndex.DIALOG};
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgb(0 0 0 / 0.5);
  overflow: auto;
  ${scrollbarNever}
`;
const Body = styled(animated.div)`
  width: 450px;
  margin: 100px auto 100px auto;
  background-color: white;
  border-radius: 4px;
  transform-origin: bottom;

  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/**
 * 弹窗
 * @author mebtte<hi@mebtte.com>
 */
const Dialog = ({
  open,
  onClose,

  maskProps = {},
  bodyProps = {},

  springConfig,
  children,
}: React.PropsWithChildren<{
  /** 开启状态 */
  open: boolean;
  /** 关闭回调 */
  onClose?: () => void;

  /** 遮罩属性 */
  maskProps?: HTMLAttributes<HTMLDivElement>;
  /** 内容属性 */
  bodyProps?: HTMLAttributes<HTMLDivElement>;

  /** react-spring 配置 */
  springConfig?: SpringConfig;
}>) => {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const onRequestClose = (event) => {
    // eslint-disable-next-line no-unused-expressions
    maskProps.onClick && maskProps.onClick(event);

    if (onClose && !bodyRef.current.contains(event.target)) {
      onClose();
    }
  };

  const transitions = useTransition(open, {
    ...TRANSITION,
    config: springConfig,
  });
  return ReactDOM.createPortal(
    transitions(({ opacity, transform }, o) =>
      o ? (
        <Mask
          {...maskProps}
          style={{
            opacity,
            ...maskProps.style,
          }}
          onClick={onRequestClose}
        >
          <Body
            {...bodyProps}
            style={{ transform, ...bodyProps.style }}
            ref={bodyRef}
          >
            {children}
          </Body>
        </Mask>
      ) : null,
    ),
    document.body,
  );
};

export const Title = styled.div`
  padding-top: 10px;
  font-size: 20px;
  font-weight: 600;
  color: rgb(55 55 55);
`;

export const Content = styled.div`
  font-size: 14px;
  color: rgb(155 155 155);
  line-height: 1.5;
`;

export const Action = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  > .left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 20px;
  }
`;

export default React.memo(Dialog, (prev, next) => {
  if (!prev.open && !next.open) {
    return true;
  }
  return false;
});
