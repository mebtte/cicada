import React, { useRef, useLayoutEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

import { TOAST_TYPE } from '@/platform/toast';
import Icon, { Name } from '@/components/icon';
import { Toast as ToastType, TOAST_ANIMATION_DURATION } from './constants';

const TYPE_MAP_COLOR = {
  [TOAST_TYPE.SUCCESS]: '82, 196, 26',
  [TOAST_TYPE.INFO]: '24, 144, 255',
  [TOAST_TYPE.ERROR]: '255, 77, 79',
};
const TYPE_MAP_ICON = {
  [TOAST_TYPE.SUCCESS]: Name.CORRECT_OUTLINE,
  [TOAST_TYPE.INFO]: Name.NOTICE_OUTLINE,
  [TOAST_TYPE.ERROR]: Name.WRONG_OUTLINE,
};

const toastIn = keyframes`
  0% {
    left: 100%;
    opacity: 0;
  } 100% {
    left: 0;
    opacity: 1;
  }
`;
const countDown = keyframes`
  0%{
    transform: scaleY(100%);
  } 100% {
    transform: scaleY(0);
  }
`;
interface StyleProps {
  top: number;
  isHidden: boolean;
  type: any;
  duration: number;
}
const Style = styled.div.attrs<StyleProps>(({ top }) => ({
  style: { top },
}))<StyleProps>`
  position: absolute;
  width: 100%;
  transition: all ${TOAST_ANIMATION_DURATION}ms ease-in-out;
  animation: ${toastIn} ${TOAST_ANIMATION_DURATION}ms ease-in-out;
  border-radius: 2px;
  display: flex;
  overflow: hidden;
  background-color: #fff;
  > .type {
    padding: 10px;
    position: relative;
    > .icon {
      z-index: 2;
      position: relative;
      color: #fff;
    }
    > .count-down {
      z-index: 1;
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      transform-origin: bottom;
    }
  }
  > .message {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    padding: 10px;
    line-height: 1.5;
    user-select: none;
  }
  > .close {
    padding: 10px;
    > .icon {
      cursor: pointer;
    }
  }
  ${({ isHidden, type, duration }) => {
    const color = TYPE_MAP_COLOR[type];
    return css`
      left: ${isHidden ? '100%' : 0};
      opacity: ${isHidden ? 0 : 1};
      box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12),
        0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
      > .type {
        background-color: rgba(${color}, 0.8);
        > .count-down {
          background-color: rgb(${color});
          animation: ${countDown} ${duration}ms linear forwards;
        }
      }
      > .message {
        color: rgb(${color});
        background-color: rgba(${color}, 0.1);
      }
      > .close {
        background-color: rgba(${color}, 0.1);
      }
    `;
  }}
`;

const Toast = ({
  toast,
  updateToastHeight,
  onClose,
}: {
  toast: ToastType;
  updateToastHeight: (id: string, height: number) => void;
  onClose: () => void;
}) => {
  const box = useRef<HTMLDivElement>();

  useLayoutEffect(() => {
    updateToastHeight(toast.id, box.current.clientHeight);
  }, [toast.id, updateToastHeight]);

  const { top, hidden, message, type, duration } = toast;
  return (
    <Style
      ref={box}
      top={top}
      isHidden={hidden}
      type={type}
      duration={duration}
    >
      <div className="type">
        <Icon className="icon" name={TYPE_MAP_ICON[type]} />
        {duration ? <div className="count-down" /> : null}
      </div>
      <div className="message">{message}</div>
      <div className="close">
        <Icon className="icon" name={Name.WRONG_OUTLINE} onClick={onClose} />
      </div>
    </Style>
  );
};

export default Toast;
