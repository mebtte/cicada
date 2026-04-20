import * as Radix from '@radix-ui/react-slider';
import styled from 'styled-components';
import classnames from 'classnames';
import { ComponentPropsWithoutRef } from 'react';
import { IS_TOUCHABLE } from '@/constants/browser';
import { CSS_VAR } from '../theme';

export type SliderEdge = 'rounded' | 'square';

const PRIMARY        = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;

const TRACK_H  = 12;   // px — 轨道高度，与 Button 同等视觉分量
const THUMB_SZ = 26;   // px — 拇指直径
const OFFSET   = 4;    // px — 阴影偏移，对应 Button md 的 4px
const BORDER   = 2;    // px — 描边宽度，与 Button 一致

// ─── fills ────────────────────────────────────────────────────────────────────

const StyledRange = styled(Radix.Range)`
  position: absolute;
  height: 100%;
  background: ${PRIMARY};
`;

// 副轨道（缓冲进度）：用主色半透明叠加
const SecondaryFill = styled.div`
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, ${PRIMARY} 30%, transparent);
  transform-origin: left;
  transition: transform 0.3s;
`;

// ─── track ────────────────────────────────────────────────────────────────────
//
// Duolingo 公式：实色填充 + 底部硬阴影（无 blur）+ hover 略亮
// 不做 active 下沉（Radix 依赖 track 的真实位置做拖拽计算，translate 会偏移命中区）

const StyledTrack = styled(Radix.Track)`
  position: relative;
  flex: 1;
  height: ${TRACK_H}px;
  background: rgb(229 231 235);
  border: ${BORDER}px solid ${PRIMARY_SHADOW};
  overflow: hidden;
  box-shadow: 0 ${OFFSET}px 0 ${PRIMARY_SHADOW};
  transition: filter 120ms;
`;

// ─── thumb ────────────────────────────────────────────────────────────────────
//
// 白底圆钮，与 Button secondary 变体同款 3D 公式：
//   正常  — 白底 + 主色描边 + 底部硬阴影
//   按下  — translateY(offset) + 阴影归零，60ms ease-in
//   释放  — 150ms ease-out 弹回

const StyledThumb = styled(Radix.Thumb)`
  display: block;
  width: ${THUMB_SZ}px;
  height: ${THUMB_SZ}px;
  border-radius: 50%;
  background: #fff;
  border: ${BORDER}px solid ${PRIMARY_SHADOW};
  box-shadow: 0 ${OFFSET}px 0 ${PRIMARY_SHADOW};
  outline: none;
  cursor: grab;
  z-index: 1;
  will-change: transform, box-shadow;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out;

  &:active {
    cursor: grabbing;
    transform: translateY(${OFFSET}px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in;
  }

  &:focus-visible {
    box-shadow:
      0 ${OFFSET}px 0 ${PRIMARY_SHADOW},
      0 0 0 3px color-mix(in srgb, ${PRIMARY} 40%, transparent);
  }

  &[data-disabled] {
    cursor: not-allowed;
  }
`;

// ─── root ─────────────────────────────────────────────────────────────────────

const StyledRoot = styled(Radix.Root)`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  touch-action: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  /* 边缘风格 */
  &.rounded ${StyledTrack} { border-radius: 999px; }
  &.square  ${StyledTrack} { border-radius: 4px;   }

  /* hover：轨道略亮，同 Button hover 行为 */
  &:not([data-disabled]):hover ${StyledTrack} {
    filter: brightness(1.06);
  }

  /* disabled */
  &[data-disabled] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* 非触摸设备：隐藏拇指 */
  &.untouchable ${StyledThumb} {
    display: none;
  }
`;

// ─── component ────────────────────────────────────────────────────────────────

export interface SliderProps
  extends Omit<
    ComponentPropsWithoutRef<typeof Radix.Root>,
    'value' | 'onValueChange' | 'onValueCommit' | 'min' | 'max' | 'step'
  > {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  edge?: SliderEdge;
  /** 副轨道值（0–1），用于缓冲进度等场景 */
  secondValue?: number;
}

function Slider({
  value,
  max = 1,
  onChange,
  edge = 'rounded',
  secondValue,
  className,
  ...props
}: SliderProps) {
  return (
    <StyledRoot
      {...props}
      min={0}
      max={max}
      step={max / 1000}
      value={[value]}
      onValueChange={([v]) => onChange?.(v)}
      className={classnames(edge, { untouchable: !IS_TOUCHABLE }, className)}
    >
      <StyledTrack>
        {secondValue !== undefined && (
          <SecondaryFill style={{ transform: `scaleX(${secondValue})` }} />
        )}
        <StyledRange />
      </StyledTrack>
      <StyledThumb />
    </StyledRoot>
  );
}

export default Slider;
