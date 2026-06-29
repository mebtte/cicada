import {
  ButtonHTMLAttributes,
  ForwardedRef,
  MouseEvent as ReactMouseEvent,
  forwardRef,
} from 'react';
import styled, { css } from 'styled-components';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '../theme';

// ─── 尺寸 ─────────────────────────────────────────────────────────────────────
//
// 沿用 Button/Input 的拟物语言(纯色填充 + 底部纯色硬阴影), 但轨道保持平贴、
// 不凸起:只有旋钮是凸起的实体键, 按下时单独压平。

const WIDTH = 58;
const HEIGHT = 34;
const PADDING = 3;
const BORDER = 2;
// border-box 下旋钮可移动区域 = 内宽 - 旋钮直径
const THUMB = HEIGHT - PADDING * 2 - BORDER * 2; // 24
const TRAVEL = WIDTH - PADDING * 2 - BORDER * 2 - THUMB; // 24
const THUMB_OFFSET = 2; // 旋钮底部硬阴影

// 旋钮当前所在水平位置, 供基础态 / 按下态复用(按下时叠加 translateY)
const thumbShift = (checked: boolean) => (checked ? `${TRAVEL}px` : '0');

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;
const CONTROL_NEUTRAL = CSSVariable.COLOR_CONTROL_NEUTRAL;

// ─── 旋钮 ─────────────────────────────────────────────────────────────────────
//
// 白色圆形旋钮, 自带底部硬阴影呈现"凸起按键"质感; 按下时随轨道一起压平。

const Thumb = styled.span<{ $checked: boolean }>`
  display: block;
  box-sizing: border-box;
  width: ${THUMB}px;
  height: ${THUMB}px;
  border: ${BORDER}px solid
    ${({ $checked }) => ($checked ? PRIMARY_SHADOW : CONTROL_NEUTRAL)};
  border-radius: 50%;
  background: #fff;
  /* off 态轨道为白底, 阴影需用更深的中性灰才有凸起对比(与旋钮描边同色) */
  box-shadow: 0 ${THUMB_OFFSET}px 0
    ${({ $checked }) => ($checked ? PRIMARY_SHADOW : CONTROL_NEUTRAL)};
  /* 静止时整体上抬 THUMB_OFFSET, 让"旋钮 + 底部硬阴影"在轨道内垂直居中 */
  transform: translateX(${({ $checked }) => thumbShift($checked)})
    translateY(-${THUMB_OFFSET}px);
  transition:
    transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 150ms ease,
    box-shadow 150ms ease;
`;

// ─── 轨道 ─────────────────────────────────────────────────────────────────────

const Root = styled.button<{ $checked: boolean }>`
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
  /* 仅留水平内边距承载旋钮行程, 垂直方向交给 align-items 居中以预留按压余量 */
  padding: 0 ${PADDING}px;
  border: ${BORDER}px solid;
  border-radius: 999px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  /* 轨道平贴、不带底部硬阴影, 凸起感完全交给旋钮 */
  transition:
    background 150ms ease,
    border-color 150ms ease;

  ${({ $checked }) =>
    $checked
      ? css`
          background: ${PRIMARY};
          border-color: ${PRIMARY_SHADOW};
        `
      : css`
          background: #fff;
          border-color: ${NEUTRAL_SHADOW};
        `}

  /* 按下时旋钮落到轨道垂直中心并收起硬阴影, 像一颗被按到底、与轨道齐平的实体键 */
  &:not(:disabled):active ${Thumb} {
    transform: translateX(${({ $checked }) => thumbShift($checked)})
      translateY(0);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in;
  }

  &:disabled {
    cursor: not-allowed;
    background: ${CSSVariable.BACKGROUND_DISABLED};
    border-color: ${CSSVariable.COLOR_DISABLED_SHADOW};
    filter: grayscale(1);
  }

  &:disabled ${Thumb} {
    border-color: ${CSSVariable.COLOR_DISABLED_SHADOW};
    box-shadow: 0 ${THUMB_OFFSET}px 0 ${CSSVariable.COLOR_DISABLED_SHADOW};
  }

  &:focus-visible {
    outline: 3px solid
      ${({ $checked }) => ($checked ? PRIMARY : CONTROL_NEUTRAL)};
    outline-offset: 3px;
  }
`;

export interface SwitchProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-checked' | 'children' | 'role' | 'type'
  > {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function Switch(
  {
    checked,
    disabled,
    onCheckedChange,
    onClick,
    ...props
  }: SwitchProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || disabled) {
      return;
    }

    onCheckedChange?.(!checked);
  };

  return (
    <Root
      {...props}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      $checked={checked}
      disabled={disabled}
      onClick={handleClick}
    >
      <Thumb $checked={checked} />
    </Root>
  );
}

export default forwardRef<HTMLButtonElement, SwitchProps>(Switch);
