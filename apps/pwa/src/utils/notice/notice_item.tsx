import { memo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { MdClose } from 'react-icons/md';
import { CSSVariable } from '@/global_style';
import { UtilZIndex } from '@/constants/style';
import { Notice, TRANSITION_DURATION, NoticeType } from './constants';
import e, { EventType } from './eventemitter';
import IconButton from '../../components/icon_button';

const NOTICE_TYPE_MAP: Record<
  NoticeType,
  {
    css: ReturnType<typeof css>;
  }
> = {
  [NoticeType.INFO]: {
    css: css`
      background-color: ${CSSVariable.COLOR_PRIMARY};
    `,
  },
  [NoticeType.ERROR]: {
    css: css`
      background-color: ${CSSVariable.COLOR_DANGEROUS};
    `,
  },
};
const slideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(100%);
  } 100% {
    opacity: 1;
    transform: translateX(0%);
  }
`;
const countdown = keyframes`
  0% {
    transform: scaleX(1);
  } 100% {
    transform: scaleX(0);
  }
`;
const Style = styled.div<{ type: NoticeType }>`
  z-index: ${UtilZIndex.NOTICE};

  position: fixed;
  right: 20px;
  max-width: 300px;

  animation: ${slideIn} ${TRANSITION_DURATION}ms ease-in-out;
  transition: all ${TRANSITION_DURATION}ms;
  box-shadow: rgb(0 0 0 / 20%) 0px 3px 5px -1px,
    rgb(0 0 0 / 14%) 0px 6px 10px 0px, rgb(0 0 0 / 12%) 0px 1px 18px 0px;

  > .top {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 15px 3px 15px;

    > .content {
      flex: 1;
      min-width: 0;

      font-size: 12px;
      line-height: 1.5;
      color: #fff;
    }

    > .close {
      margin-right: -10px;

      color: #fff;
    }
  }

  > .progress {
    height: 2px;
    background-color: rgb(255 255 255 / 0.4);
    transform-origin: right;
    animation-name: ${countdown};
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }

  ${({ type }) => NOTICE_TYPE_MAP[type].css}
`;

function NoticeItem({ notice }: { notice: Notice }) {
  const ref = useRef<HTMLDivElement>(null);
  const { id, type, duration, content, visible, top, closable } = notice;
  const onClose = useCallback(() => e.emit(EventType.CLOSE, { id }), [id]);

  useEffect(() => {
    if (duration !== 0) {
      window.setTimeout(onClose, duration);
    }
  }, [duration, onClose]);

  useLayoutEffect(() => {
    e.emit(EventType.UPDATE_HEIGHT, { id, height: ref.current!.clientHeight });
  }, [id]);

  return (
    <Style
      ref={ref}
      style={{
        top,
        opacity: visible ? 1 : 0,
        transform: `translateX(${visible ? 0 : 100}%)`,
      }}
      type={type}
    >
      <div className="top">
        <div className="content">{content}</div>
        {closable ? (
          <IconButton className="close" onClick={onClose} size={24}>
            <MdClose />
          </IconButton>
        ) : null}
      </div>
      {duration === 0 ? null : (
        <div
          className="progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </Style>
  );
}

export default memo(NoticeItem);
