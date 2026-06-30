import * as Radix from '@radix-ui/react-slider';
import styled, { css } from 'styled-components';
import hover from '@/style/hover';
import classnames from 'classnames';
import { ComponentPropsWithoutRef } from 'react';
import { CSS_VAR } from '../theme';

export type SliderEdge = 'rounded' | 'square';

const PRIMARY        = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;

const TRACK_H  = 12;   // px — 轨道高度，与 Button 同等视觉分量
const OFFSET   = 4;    // px — 阴影偏移，对应 Button md 的 4px
const BORDER   = 2;    // px — 描边宽度，与 Button 一致

// ─── fills ────────────────────────────────────────────────────────────────────

const StyledRange = styled(Radix.Range)`
  position: absolute;
  height: 100%;
  background: ${PRIMARY};
  z-index: 1;
`;

// 副轨道（缓冲进度）：用主色半透明叠加
const SecondaryFill = styled.div`
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, ${PRIMARY} 30%, transparent);
  transform-origin: left;
  transition: transform 0.3s;
  z-index: 0;
`;

// ─── track ────────────────────────────────────────────────────────────────────
//
// Duolingo 公式：实色填充 + 底部硬阴影（无 blur）+ hover 略亮
// 不做 active 下沉（Radix 依赖 track 的真实位置做拖拽计算，translate 会偏移命中区）

const StyledTrack = styled(Radix.Track)`
  position: relative;
  flex: 1;
  height: ${TRACK_H}px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 ${OFFSET}px 0 ${PRIMARY_SHADOW};
  isolation: isolate;
  transition: filter 120ms;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border: ${BORDER}px solid ${PRIMARY_SHADOW};
    border-radius: inherit;
    pointer-events: none;
    z-index: 2;
  }
`;

// ─── thumb ────────────────────────────────────────────────────────────────────
//
// 拇指视觉已移除：仅保留一个不可见的 Radix.Thumb，供拖拽 / 键盘 / 取值使用
// （轨道点击与拖拽不依赖拇指可见性）

const StyledThumb = styled(Radix.Thumb)`
  display: block;
  width: 0;
  height: 0;
  outline: none;
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
  ${hover(css`
    &:not([data-disabled]):hover ${StyledTrack} {
      filter: brightness(1.06);
    }
  `)}

  /* disabled */
  &[data-disabled] {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

// ─── component ────────────────────────────────────────────────────────────────

export interface SliderProps
  extends Omit<
    ComponentPropsWithoutRef<typeof Radix.Root>,
    'value' | 'onChange' | 'onValueChange' | 'onValueCommit' | 'min' | 'max' | 'step'
  > {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
  edge?: SliderEdge;
  /** 副轨道值（0–1），用于缓冲进度等场景 */
  secondValue?: number;
}

function Slider({
  value,
  max = 1,
  onChange,
  onCommit,
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
      onValueCommit={([v]) => onCommit?.(v)}
      className={classnames(edge, className)}
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
