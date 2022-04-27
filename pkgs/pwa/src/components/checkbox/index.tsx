import React, { useCallback } from 'react';
import styled, { css } from 'styled-components';

import { ComponentSize } from '@/constants/style';
import Icon, { Name } from '../icon';

const Container = styled.div<{
  disabled: boolean;
  checked: boolean;
}>`
  display: inline-block;
  font-size: 0;
  position: relative;
  > .outline {
    color: rgb(88 88 88);
    transition: all 300ms;
  }
  > .checked {
    position: absolute;
    top: 0;
    left: 0;
    color: rgb(49 194 124);
    transition: all 300ms;
  }
  ${({ checked, disabled }) => css`
    opacity: ${disabled ? '0.5' : '1'};
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
    > .outline {
      opacity: ${checked ? '0' : '1'};
    }
    > .checked {
      transform: scale(${checked ? '1' : '0'});
    }
  `}
`;

/**
 * 勾选框
 * @author mebtte<hi@mebtte.com>
 */
const Checkbox = ({
  checked,
  onChange,
  disabled = false,
  size = ComponentSize.SMALL,
  ...props
}: {
  /** 选中状态 */
  checked: boolean;
  /** 切换选中回调 */
  onChange?: (checked: boolean) => void;
  /** 禁用 */
  disabled?: boolean;
  /** 尺寸, 数字单位 px 或字符串 */
  size?: number | string;
  [key: string]: any;
}) => {
  const onClickWrapper = useCallback(() => {
    if (!onChange || disabled) {
      return;
    }
    onChange(!checked);
  }, [checked, onChange, disabled]);
  return (
    <Container
      {...props}
      checked={checked}
      disabled={disabled}
      onClick={onClickWrapper}
    >
      <Icon className="outline" name={Name.CHECKBOX_OUTLINE} size={size} />
      <Icon className="checked" name={Name.CHECKBOX_FILL} size={size} />
    </Container>
  );
};

export default React.memo(Checkbox);
