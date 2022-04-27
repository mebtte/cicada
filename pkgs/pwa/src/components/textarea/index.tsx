import React, {
  TextareaHTMLAttributes,
  useImperativeHandle,
  useRef,
  useCallback,
} from 'react';
import styled from 'styled-components';

const Style = styled.textarea`
  border: none;
  border-radius: 4px;
  outline: none;
  color: rgb(55 55 55);
  background-color: #f6f6f6;
  height: 32px;
  box-sizing: border-box;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  transition: all 300ms;
  &:focus {
    color: rgb(33 33 33);
    box-shadow: inset 0 0 0 2px rgb(49 194 124 / 0.8);
  }
  &:disabled {
    background-color: #e6e6e6;
    color: rgb(155 155 155);
    cursor: not-allowed;
  }
`;

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * 输入区域
 * @author mebtte<hi@mebtte.com>
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(
  (props: Props, ref) => {
    const innerRef = useRef<HTMLTextAreaElement>();
    useImperativeHandle(ref, () => innerRef.current);

    const { onKeyDown } = props;
    const onKeyDownWrapper = useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (onKeyDown) {
          onKeyDown(event);
        }

        const { key } = event;
        if (key.toLowerCase() === 'escape') {
          innerRef.current.blur();
        }
      },
      [onKeyDown],
    );

    return <Style {...props} onKeyDown={onKeyDownWrapper} ref={innerRef} />;
  },
);

export default Textarea;
