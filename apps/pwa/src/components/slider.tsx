import { CSSVariable } from '#/global_style';
import {
  HtmlHTMLAttributes,
  PointerEvent,
  PointerEventHandler,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import classnames from 'classnames';
import { IS_TOUCHABLE } from '@/constants/browser';
import { flexCenter } from '#/style/flexbox';

const THUMB_SIZE = 24;
const Style = styled.div`
  position: relative;

  height: 5px;
  background-color: rgb(145 222 202);
  cursor: pointer;

  transform-origin: bottom;
  transition: 100ms;

  > .progress {
    height: 100%;

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
      transform: scaleY(3);
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
  current,
  onChange,
  max = 1,
  className,
  ...props
}: Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> & {
  current: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const pointerDownRef = useRef(false);

  const [innerPercent, setInnerPercent] = useState<number | undefined>(
    undefined,
  );

  const onPointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    pointerDownRef.current = true;

    const percent = getPointerEventRelativePercent(e);
    setInnerPercent(percent);
  };
  const onPointerMove: PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerDownRef.current) {
      const percent = getPointerEventRelativePercent(e);
      setInnerPercent(percent);
    }
  };
  const onPointerUp: PointerEventHandler<HTMLDivElement> = (e) => {
    pointerDownRef.current = false;

    const percent = getPointerEventRelativePercent(e);
    onChange(max * percent);

    window.setTimeout(() => setInnerPercent(undefined), 0);
  };

  const actualPercent = innerPercent ?? current / max;
  return (
    <Style
      {...props}
      className={classnames(
        {
          untouchable: !IS_TOUCHABLE,
        },
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
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
