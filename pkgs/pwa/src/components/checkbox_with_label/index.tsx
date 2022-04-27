import React from 'react';
import styled, { css } from 'styled-components';

import Checkbox from '@/components/checkbox';

const Style = styled.div<{
  disabled: boolean;
}>`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  > .label {
    font-size: 14px;
    color: var(--text-color-primary);
  }
  ${({ disabled }) => css`
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
    > .label {
      opacity: ${disabled ? '0.5' : '1'};
    }
  `}
`;

const CheckboxWithLabel = ({
  label,
  checked,
  onChange,
  disabled,
  onClick,
  ...props
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  disabled?: boolean;
  [key: string]: any;
}) => {
  const onClickWrapper: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (disabled) {
      return;
    }
    onChange(!checked);
    return onClick && onClick(event);
  };
  return (
    <Style {...props} disabled={disabled} onClick={onClickWrapper}>
      <Checkbox checked={checked} disabled={disabled} />
      <div className="label">{label}</div>
    </Style>
  );
};

export default React.memo(CheckboxWithLabel);
