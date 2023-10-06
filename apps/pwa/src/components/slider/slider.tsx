import { CSSVariable } from '@/global_style';
import {
  HtmlHTMLAttributes,
  PointerEvent,
  PointerEventHandler,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import classnames from 'classnames';
import { IS_TOUCHABLE } from '@/constants/browser';
import { flexCenter } from '@/style/flexbox';
import absoluteFullSize from '@/style/absolute_full_size';
import { Edge } from './constants';

const THUMB_SIZE = 24;
const Style = styled.div`
  position: relative;

  height: 5px;
  background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_THREE};
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  transition: 100ms;

  &.${Edge.ROUNDED} {
    border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
    overflow: hidden;
  }

  > .progress {
    ${absoluteFullSize}

    background-color: ${CSSVariable.COLOR_PRIMARY};
    transform-origin: left;
  }

  > .thumb {
    position: absolute;
    top: calc(50% - ${THUMB_SIZE / 2}px);
    width: ${THUMB_SIZE}px;
    height: ${THUMB_SIZE}px;

    transform: translateX(-50%);

    ${flexCenter}

    >.inner {
      width: 50%;
      height: 50%;
      background-color: ${CSSVariable.COLOR_PRIMARY};
    }
  }

  &.untouchable {
    &:hover {
      transform: scaleY(2);
    }
  }
`;
const getPointerEventRelativePercent = (
  event: PointerEvent<HTMLDivElement>,
) => {
  const target = event.currentTarget as HTMLDivElement;
  const rect = target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percent = x / target.clientWidth;
  return Math.max(Math.min(percent, 1), 0);
};

function Slider({
  edge = Edge.ROUNDED,
  current,
  onChange,
  max = 1,
  className,
  secondTrack,
  ...props
}: Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> & {
  edge?: Edge;
  current: number;
  onChange?: (v: number) => void;
  max?: number;
  secondTrack?: ReactNode;
}) {
  const pointerDownRef = useRef(false);

  const [shadowPercent, setShadowPercent] = useState<number | undefined>(
    undefined,
  );

  const onPointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    pointerDownRef.current = true;

    const percent = getPointerEventRelativePercent(e);
    setShadowPercent(percent);
  };
  const onPointerMove: PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerDownRef.current) {
      const percent = getPointerEventRelativePercent(e);
      setShadowPercent(percent);
    }
  };
  const onPointerUp: PointerEventHandler<HTMLDivElement> = (e) => {
    pointerDownRef.current = false;

    const percent = getPointerEventRelativePercent(e);
    // eslint-disable-next-line no-unused-expressions
    onChange && onChange(max * percent);

    window.setTimeout(() => setShadowPercent(undefined), 0);
  };

  useEffect(() => {
    const onLeaveDocument = () => {
      pointerDownRef.current = false;
      window.setTimeout(() => setShadowPercent(undefined), 0);
    };
    document.addEventListener('mouseleave', onLeaveDocument);
    return () => document.removeEventListener('mouseleave', onLeaveDocument);
  }, []);

  const actualPercent = shadowPercent ?? current / max;
  return (
    <Style
      {...props}
      className={classnames(
        {
          untouchable: !IS_TOUCHABLE,
          [edge]: true,
        },
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      {secondTrack}
      <div
        className="progress"
        style={{
          transform: `scaleX(${actualPercent})`,
        }}
      />
      {IS_TOUCHABLE ? (
        <div
          className="thumb"
          style={{
            left: `${actualPercent * 100}%`,
          }}
        >
          <div className="inner" />
        </div>
      ) : null}
    </Style>
  );
}

export default Slider;
