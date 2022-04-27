import React, { HTMLAttributes, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { useTransition, animated } from 'react-spring';

import { ZIndex } from '../constants/style';
import scrollbarAsNeeded from '../style/scrollbar_as_needed';

const Mask = styled(animated.div)`
  z-index: ${ZIndex.DRAWER};
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgb(0 0 0 / 0.5);
  -webkit-app-region: no-drag;
`;
const Body = styled(animated.div)`
  ${scrollbarAsNeeded}
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background-color: white;
  overflow: hidden;
  box-shadow: 0px 8px 10px -5px rgba(0, 0, 0, 0.2),
    0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
`;

const Drawer = ({
  open,
  onClose,

  maskProps = {},
  bodyProps = {},

  children,
}: React.PropsWithChildren<{
  open: boolean;
  onClose: () => void;

  maskProps?: HTMLAttributes<HTMLDivElement>;
  bodyProps?: HTMLAttributes<HTMLDivElement>;
}>) => {
  const bodyRef = useRef<HTMLDivElement>();
  const onRequestClose = (event) => {
    // eslint-disable-next-line no-unused-expressions
    maskProps.onClick && maskProps.onClick(event);

    if (onClose && !bodyRef.current.contains(event.target)) {
      onClose();
    }
  };

  const transitions = useTransition(open, {
    from: {
      opacity: 0,
      transform: 'translate(120%)',
    },
    enter: { opacity: 1, transform: 'translate(0%)' },
    leave: {
      opacity: 0,
      transform: 'translate(120%)',
    },
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
            ref={bodyRef}
            style={{
              transform,
              ...bodyProps.style,
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

export const Title = styled.div`
  font-size: 20px;
  font-weight: 600;
  padding: 40px 20px 20px 20px;
  color: rgb(55 55 55);
`;

export default React.memo(Drawer, (prevProps, props) => {
  if (prevProps.open || props.open) {
    return false;
  }
  return true;
});
