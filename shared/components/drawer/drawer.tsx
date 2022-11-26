/* eslint-disable no-unused-expressions */
import {
  HTMLAttributes,
  useRef,
  MouseEventHandler,
  PropsWithChildren,
  memo,
} from 'react';
import ReactDOM from 'react-dom';
import styled, { css } from 'styled-components';
import { useTransition, animated, UseTransitionProps } from 'react-spring';
import { Direction } from './constants';

const DIRECTION_MAP: Record<
  Direction,
  {
    transition: UseTransitionProps<boolean>;
    bodyCss: ReturnType<typeof css>;
  }
> = {
  [Direction.LEFT]: {
    transition: {
      from: {
        opacity: 0,
        transform: 'translate(-120%)',
      },
      enter: { opacity: 1, transform: 'translate(0%)' },
      leave: {
        opacity: 0,
        transform: 'translate(-120%)',
      },
    },
    bodyCss: css`
      left: 0;
    `,
  },
  [Direction.RIGHT]: {
    transition: {
      from: {
        opacity: 0,
        transform: 'translate(120%)',
      },
      enter: { opacity: 1, transform: 'translate(0%)' },
      leave: {
        opacity: 0,
        transform: 'translate(120%)',
      },
    },
    bodyCss: css`
      right: 0;
    `,
  },
};
const Mask = styled(animated.div)`
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgb(0 0 0 / 0.5);
  -webkit-app-region: no-drag;
`;
const Body = styled(animated.div)<{ direction: Direction }>`
  position: absolute;
  top: 0;
  height: 100%;
  background-color: white;
  overflow: hidden;
  box-shadow: 0px 8px 10px -5px rgba(0, 0, 0, 0.2),
    0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;

  ${({ direction }) => DIRECTION_MAP[direction].bodyCss}
`;

const Drawer = ({
  open,
  onClose,

  direction = Direction.RIGHT,

  maskProps = {},
  bodyProps = {},

  children,
}: PropsWithChildren<{
  open: boolean;
  onClose: () => void;

  direction?: Direction;

  maskProps?: HTMLAttributes<HTMLDivElement>;
  bodyProps?: HTMLAttributes<HTMLDivElement>;
}>) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const onClickWrapper: MouseEventHandler<HTMLDivElement> = (event) => {
    maskProps.onClick && maskProps.onClick(event);

    if (onClose && !bodyRef.current!.contains(event.target as HTMLElement)) {
      onClose();
    }
  };

  const transitions = useTransition(open, DIRECTION_MAP[direction].transition);
  return ReactDOM.createPortal(
    transitions(({ opacity, transform }, o) =>
      o ? (
        <Mask
          {...maskProps}
          style={{
            opacity,
            ...maskProps.style,
          }}
          onClick={onClickWrapper}
        >
          <Body
            {...bodyProps}
            ref={bodyRef}
            direction={direction}
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

export default memo(Drawer, (prevProps, props) => {
  if (prevProps.open || props.open) {
    return false;
  }
  return true;
});
