/**
 * Tooltip — 基于 @tippyjs/react 封装的 Duolingo 风格提示气泡
 *
 * 交互策略:
 * - 鼠标 hover: 延迟 300ms 显示, 离开立即消失
 * - 触屏 short tap: 不显示 tooltip, 透传 click 给子元素
 * - 触屏 long press (>=500ms): 显示 tooltip, 同时压制本次 click
 *
 * 用法:
 *   <Tooltip content="编辑歌手">
 *     <Button>编辑</Button>
 *   </Tooltip>
 */

import {
  cloneElement,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
  useMemo,
  useRef,
} from 'react';
import Tippy, { TippyProps } from '@tippyjs/react/headless';
import { animated, useSpring } from 'react-spring';
import styled from 'styled-components';

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const Bubble = styled(animated.div)`
  /* Duolingo 风格: 深底白字 + 立体阴影 */
  max-width: 240px;
  padding: 6px 10px;

  background: rgb(60 60 60);
  color: #fff;
  border: 2px solid rgb(35 35 35);
  border-radius: 12px;
  box-shadow: 0 4px 0 rgb(35 35 35);

  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2px;
  line-height: 1.35;
  text-align: center;
  word-break: break-word;

  /* 英文采用 sentence case: 仅首字母大写, 与 DialogDescription 等组件保持一致 */
  &::first-letter {
    text-transform: uppercase;
  }

  /* 防止 tooltip 自身吞掉 trigger 的事件 */
  pointer-events: none;

  /* Tippy 已经处理过定位, 这里只负责出场动画基线 */
  will-change: transform, opacity;
`;

type Placement = 'top' | 'bottom' | 'left' | 'right';
type TooltipChildProps = { ref?: Ref<Element> };

export type TooltipProps = {
  /** Tooltip content. Empty values skip rendering the tooltip and return the child directly. */
  content: ReactNode;
  /** Trigger element. Must be a single ReactElement that can receive refs and events. */
  children: ReactElement;
};

/**
 * 出场动画方向: 根据 placement 推断出场偏移方向, 让 tooltip 看起来从 trigger "推出"
 */
function getOffsetByPlacement(placement: Placement): {
  x: number;
  y: number;
} {
  switch (placement) {
    case 'top':
      return { x: 0, y: 4 };
    case 'bottom':
      return { x: 0, y: -4 };
    case 'left':
      return { x: 4, y: 0 };
    case 'right':
      return { x: -4, y: 0 };
  }
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;

  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  ref.current = value;
}

const Tooltip = ({
  content,
  children,
}: TooltipProps) => {
  const referenceRef = useRef<Element>(null);
  const childRef = (children.props as TooltipChildProps).ref;
  // Tippy 4 会读取 children.ref，React 19 下会产生 warning；这里改为显式 reference。
  const mergedReferenceRef = useMemo(
    () => (node: Element | null) => {
      referenceRef.current = node;
      assignRef(childRef, node);
    },
    [childRef],
  );

  if (content === null || content === undefined || content === '') {
    return children;
  }

  return (
    <>
      {cloneElement(children as ReactElement<TooltipChildProps>, {
        ref: mergedReferenceRef,
      })}
      <Tippy
        reference={referenceRef as RefObject<Element>}
        placement="top"
        delay={[300, 0]}
        // 触屏: 长按才显示, short tap 不会触发, click 自然透传
        touch={['hold', 500]}
        // 关闭 Tippy 默认动画, 由 react-spring 接管
        animation={false}
        // 渲染到 body, 避免被祖先 overflow 截断
        appendTo={() => document.body}
        render={(attrs) => (
          <TooltipBody attrs={attrs}>
            {content}
          </TooltipBody>
        )}
      />
    </>
  );
};

/**
 * 把 react-spring 的过渡逻辑封装到内部组件:
 * Tippy 通过 render 回调把定位 attrs 给我们, 我们只负责样式 + 入场动画
 */
const TooltipBody = ({
  attrs,
  children,
}: {
  attrs: Parameters<NonNullable<TippyProps['render']>>[0];
  children: ReactNode;
}) => {
  // 根据实际 placement (可能因翻转而变化) 决定动画方向
  const actualPlacement = (attrs['data-placement'] as Placement) || 'top';
  const offset = getOffsetByPlacement(actualPlacement);
  const style = useSpring({
    from: {
      opacity: 0,
      transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
    config: { tension: 340, friction: 28 },
  });

  return (
    <Bubble {...attrs} style={style}>
      {children}
    </Bubble>
  );
};

export default Tooltip;
