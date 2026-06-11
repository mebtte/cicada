import { memo, ReactNode, useCallback, useLayoutEffect, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { Branch as DismissableLayerBranch } from '@radix-ui/react-dismissable-layer';
import { CSSVariable } from '@/global_style';
import { UtilZIndex } from '@/constants/style';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { Notice, TRANSITION_DURATION, NoticeType } from './constants';
import e, { EventType } from './eventemitter';
import Button from '@/components/button';
import { Close, Info, Error as ErrorIcon } from '@/components/icon';

const NOTICE_TYPE_MAP: Record<
  NoticeType,
  {
    icon: ReactNode;
    css: ReturnType<typeof css>;
  }
> = {
  [NoticeType.INFO]: {
    icon: <Info />,
    css: css`
      background-color: ${CSSVariable.COLOR_PRIMARY};
      border-color: ${CSSVariable.COLOR_PRIMARY_ACTIVE};
      box-shadow:
        0 4px 0 ${CSSVariable.COLOR_PRIMARY_ACTIVE},
        0 14px 28px rgb(0 0 0 / 0.18),
        0 0 18px rgb(44 182 125 / 0.28);
    `,
  },
  [NoticeType.ERROR]: {
    icon: <ErrorIcon />,
    css: css`
      background-color: ${CSSVariable.COLOR_DANGEROUS};
      border-color: rgb(190 46 34);
      box-shadow:
        0 4px 0 rgb(190 46 34),
        0 14px 28px rgb(0 0 0 / 0.18),
        0 0 18px rgb(242 80 66 / 0.24);
    `,
  },
};
const slideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(110%);
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
  max-width: min(320px, 75%);

  /**
   * Radix Dialog 在 modal 模式下会给 body 设置 pointer-events: none,
   * notice 渲染在 body 上, 会继承该样式导致无法点击, 故显式开启.
   * @author mebtte<i@mebtte.com>
   */
  pointer-events: auto;

  overflow: hidden;
  border-style: solid;
  border-width: 2px;
  border-radius: 16px;
  animation: ${slideIn} ${TRANSITION_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1);
  transition:
    top ${TRANSITION_DURATION}ms ease-out,
    opacity ${TRANSITION_DURATION}ms ease-out,
    transform ${TRANSITION_DURATION}ms ease-out;

  > .top {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px 10px 14px;

    > .type-icon {
      flex: 0 0 auto;
      width: 22px;
      height: 22px;

      display: flex;
      align-items: center;
      justify-content: center;

      color: #fff;
      font-size: 22px;
      line-height: 1;

      > svg {
        display: block;
      }
    }

    > .content {
      flex: 1;
      min-width: 0;

      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      font-weight: 700;
      line-height: 1.35;
      color: #fff;
      letter-spacing: 0.1px;
      overflow-wrap: anywhere;

      ${upperCaseFirstLetter}
    }

    > .close {
      flex: 0 0 auto;

      color: #fff;
    }
  }

  > .progress {
    height: 3px;
    background-color: rgb(255 255 255 / 0.55);
    transform-origin: right;
    animation-name: ${countdown};
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }

  &:hover {
    > .progress {
      animation-play-state: paused;
    }
  }

  ${({ type }) => NOTICE_TYPE_MAP[type].css}
`;

function NoticeItem({ notice }: { notice: Notice }) {
  const ref = useRef<HTMLDivElement>(null);
  const { id, type, duration, content, visible, top, closable, showTypeIcon } =
    notice;
  const onClose = useCallback(() => e.emit(EventType.CLOSE, { id }), [id]);

  useLayoutEffect(() => {
    e.emit(EventType.UPDATE_HEIGHT, { id, height: ref.current!.clientHeight });
  }, [id]);

  return (
    // Notice 在独立的 React root 上, 需要注册为 Radix branch, 避免点击 notice 被 drawer/dialog 判定为外部点击并关闭.
    <DismissableLayerBranch asChild>
      <Style
        ref={ref}
        style={{
          top,
          opacity: visible ? 1 : 0,
          transform: `translateX(${visible ? 0 : 110}%)`,
        }}
        type={type}
      >
        <div className="top">
          {showTypeIcon ? (
            <div className="type-icon">{NOTICE_TYPE_MAP[type].icon}</div>
          ) : null}
          <div className="content">{content}</div>
          {closable ? (
            <Button
              className="close"
              square
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <Close />
            </Button>
          ) : null}
        </div>
        {duration === 0 ? null : (
          <div
            className="progress"
            style={{ animationDuration: `${duration}ms` }}
            onAnimationEnd={onClose}
          />
        )}
      </Style>
    </DismissableLayerBranch>
  );
}

export default memo(NoticeItem);
