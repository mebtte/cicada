import { ForwardedRef, forwardRef, TextareaHTMLAttributes } from 'react';
import styled from 'styled-components';
import {
  CONTROL_SIZE,
  ControlSize,
  controlDisabledTextStyles,
  controlPlaceholderStyles,
  controlSurfaceStyles,
  controlTextStyles,
} from './control_style';

export type TextareaSize = ControlSize;

const StyledTextarea = styled.textarea<{
  $size: TextareaSize;
  $error: boolean;
  $disabled: boolean;
}>`
  display: block;
  width: 100%;
  min-width: 0;
  line-height: 1.45;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
  resize: none;

  ${controlSurfaceStyles('&:focus')}
  ${controlTextStyles}
  ${controlPlaceholderStyles}
  ${controlDisabledTextStyles}

  ${({ $size }) => {
    return `
      padding: ${CONTROL_SIZE[$size].textareaPadding};
    `;
  }}
`;

export type TextareaProps = {
  disabled?: boolean;
  error?: boolean | string;
  size?: TextareaSize;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>;

function Wrapper(
  { disabled = false, error = false, size = 'md', ...props }: TextareaProps,
  ref: ForwardedRef<HTMLTextAreaElement>,
) {
  return (
    <StyledTextarea
      {...props}
      $disabled={disabled}
      $error={!!error}
      $size={size}
      autoComplete="off"
      disabled={disabled}
      ref={ref}
    />
  );
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(Wrapper);

Textarea.displayName = 'Textarea';

export default Textarea;
