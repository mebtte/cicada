import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from 'react';
import styled from 'styled-components';
import Label from '../label';
import {
  CONTROL_AFFIX_COLOR,
  CONTROL_ERROR_COLOR,
  CONTROL_FONT,
  CONTROL_MUTED_TEXT_COLOR,
  CONTROL_PRIMARY_COLOR,
  CONTROL_SIZE,
  ControlSize,
  controlDisabledTextStyles,
  controlPlaceholderStyles,
  controlSurfaceStyles,
  controlTextStyles,
} from '../control_style';

export type InputSize = ControlSize;

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
  cursor: text;
  -webkit-tap-highlight-color: transparent;

  ${controlSurfaceStyles('&:focus-within')}

  ${({ $size }) => {
    const s = CONTROL_SIZE[$size];
    return `
      height: ${s.height}px;
      padding: ${s.inputPadding};
    `;
  }}
`;

const Affix = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: ${CONTROL_AFFIX_COLOR};

  ${Wrapper}:focus-within & {
    color: ${CONTROL_PRIMARY_COLOR};
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
  -webkit-tap-highlight-color: transparent;

  ${controlTextStyles}
  ${controlPlaceholderStyles}
  ${controlDisabledTextStyles}
`;

const Bottom = styled.p<{ $error: boolean }>`
  margin: 0;
  font-family: ${CONTROL_FONT};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: ${({ $error }) =>
    $error ? CONTROL_ERROR_COLOR : CONTROL_MUTED_TEXT_COLOR};
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
      type = 'text',
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
            type={type}
            disabled={disabled}
            {...rest}
            autoComplete={type === 'password' ? 'new-password' : 'off'}
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
