import { useRef, HTMLAttributes } from 'react';
import * as React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { useTransition, animated } from 'react-spring';
import autoScrollbar from '@/style/auto_scrollbar';

const Mask = styled(animated.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  background-color: rgba(0, 0, 0, 0.5);

  display: flex;
  align-items: flex-end;
  justify-content: center;
`;
const Body = styled(animated.div)`
  width: 100%;
  max-width: min(300px, 100%);
  max-height: 75%;

  overflow: auto;
  ${autoScrollbar}

  box-shadow: 0px 8px 10px -5px rgba(0, 0, 0, 0.2),
    0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12);
  background-color: #fff;
`;

/**
 * 弹出框
 * @author mebtte<hi@mebtte.com>
 */
const Popup = ({
  open,
  onClose,
  maskProps = {},
  bodyProps = {},
  children,
}: React.PropsWithChildren<{
  /** 开启状态 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;

  /** 遮罩属性 */
  maskProps?: HTMLAttributes<HTMLDivElement>;
  /** 内容属性 */
  bodyProps?: HTMLAttributes<HTMLDivElement>;
}>) => {
  const transitions = useTransition(open, {
    from: {
      opacity: 0,
      transform: 'translateY(100%)',
    },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: {
      opacity: 0,
      transform: 'translateY(100%)',
    },
  });
  const bodyRef = useRef<HTMLDivElement>(null);
  const onClickWrapper = (event) => {
    if (!bodyRef.current || !bodyRef.current.contains(event.target)) {
      onClose();
    }

    // eslint-disable-next-line no-unused-expressions
    maskProps.onClick && maskProps.onClick(event);
  };

  return ReactDOM.createPortal(
    transitions(({ opacity, transform }, o) =>
      o ? (
        <Mask
          {...maskProps}
          style={{ ...maskProps.style, opacity }}
          onClick={onClickWrapper}
        >
          <Body
            {...bodyProps}
            ref={bodyRef}
            style={{
              ...bodyProps.style,
              transform,
            }}
          >
            {children}
          </Body>
        </Mask>
      ) : null,
    ),
    document.body,
  );
};

export default React.memo(Popup, (prev, next) => {
  if (!prev.open && !next.open) {
    return true;
  }
  return false;
});
