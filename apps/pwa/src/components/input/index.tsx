import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from 'react';
import styled, { css } from 'styled-components';
import { CSS_VAR } from '../theme';
import Label from '../label';

export type InputSize = 'sm' | 'md' | 'lg';

// ─── Size tokens（与 Button 对齐） ────────────────────────────────────────────

const SIZE: Record<
  InputSize,
  { height: number; font: number; radius: number; shadow: number; padding: string }
> = {
  sm: { height: 34, font: 13, radius: 10, shadow: 3, padding: '0 12px' },
  md: { height: 44, font: 15, radius: 13, shadow: 4, padding: '0 14px' },
  lg: { height: 54, font: 17, radius: 16, shadow: 5, padding: '0 18px' },
};

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;
const DISABLED_BACKGROUND = 'rgb(248 248 248)';
const DISABLED_BORDER = 'rgb(226 226 226)';
const DISABLED_SHADOW = 'rgb(214 214 214)';

// ─── Styled ───────────────────────────────────────────────────────────────────

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const Wrapper = styled.div<{
  $size: InputSize;
  $error: boolean;
  $disabled: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-style: solid;
  border-width: 2px;
  cursor: text;
  -webkit-tap-highlight-color: transparent;

  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out;

  /* 尺寸 */
  ${({ $size }) => {
    const s = SIZE[$size];
    return css`
      height: ${s.height}px;
      padding: ${s.padding};
      border-radius: ${s.radius}px;
      box-shadow: 0 ${s.shadow}px 0 rgb(185 185 185);
    `;
  }}

  /* 默认状态 */
  border-color: rgb(220 220 220);

  /* 聚焦 */
  &:focus-within {
    border-color: var(${CSS_VAR.colorPrimary});
    box-shadow: ${({ $size }) =>
      `0 ${SIZE[$size].shadow}px 0 var(${CSS_VAR.colorPrimaryShadow})`};
  }

  /* 错误 */
  ${({ $error, $size }) =>
    $error &&
    css`
      border-color: rgb(242 80 66);
      box-shadow: 0 ${SIZE[$size].shadow}px 0 rgb(190 46 34);

      &:focus-within {
        border-color: rgb(242 80 66);
        box-shadow: 0 ${SIZE[$size].shadow}px 0 rgb(190 46 34);
      }
    `}

  /* 禁用 */
  ${({ $disabled, $size }) =>
    $disabled &&
    css`
      background: ${DISABLED_BACKGROUND};
      border-color: ${DISABLED_BORDER};
      box-shadow: 0 ${SIZE[$size].shadow}px 0 ${DISABLED_SHADOW};
      cursor: not-allowed;
    `}
`;

const Affix = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: rgb(175 175 175);

  /* 聚焦时前后缀也跟着变色 */
  ${Wrapper}:focus-within & {
    color: var(${CSS_VAR.colorPrimary});
  }
`;

const NativeInput = styled.input<{ $size: InputSize }>`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-color: transparent;
  font-family: ${FONT};
  font-weight: 600;
  letter-spacing: 0.2px;
  color: rgb(55 55 55);
  -webkit-tap-highlight-color: transparent;

  font-size: ${({ $size }) => SIZE[$size].font}px;

  @media (pointer: coarse) {
    font-size: ${({ $size }) => Math.max(SIZE[$size].font, 16)}px;
  }

  &::placeholder {
    color: rgb(205 205 205);
    font-weight: 500;
  }

  &:disabled {
    cursor: not-allowed;
    color: rgb(145 145 145);
  }
`;

const Bottom = styled.p<{ $error: boolean }>`
  margin: 0;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: ${({ $error }) => ($error ? 'rgb(242 80 66)' : 'rgb(160 160 160)')};
`;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** 输入框尺寸，默认 md */
  size?: InputSize;
  /** 标签文字 */
  label?: string;
  /** 输入框前置内容（图标等） */
  prefix?: ReactNode;
  /** 输入框后置内容（图标、按钮等） */
  suffix?: ReactNode;
  /** 错误提示（非空时触发错误样式） */
  error?: string;
  /** 辅助说明文字（有 error 时被 error 替代） */
  hint?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      label,
      prefix,
      suffix,
      error,
      hint,
      disabled,
      id: idProp,
      className,
      style,
      autoFocus,
      ...rest
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const bottom = error || hint;

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    useEffect(() => {
      if (!autoFocus) return undefined;

      const frame = window.requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });

      return () => window.cancelAnimationFrame(frame);
    }, [autoFocus]);

    return (
      <Root className={className} style={style}>
        {label && <Label htmlFor={id}>{label}</Label>}
        <Wrapper $size={size} $error={!!error} $disabled={!!disabled}>
          {prefix && <Affix>{prefix}</Affix>}
          <NativeInput
            ref={inputRef}
            id={id}
            $size={size}
            disabled={disabled}
            {...rest}
          />
          {suffix && <Affix>{suffix}</Affix>}
        </Wrapper>
        {bottom && <Bottom $error={!!error}>{bottom}</Bottom>}
      </Root>
    );
  },
);

Input.displayName = 'Input';

export default Input;
