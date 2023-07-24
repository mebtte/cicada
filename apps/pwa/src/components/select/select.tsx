import { HtmlHTMLAttributes, ReactNode, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import capitalize from '@/style/capitalize';
import { ComponentSize } from '../../constants/style';
import { CSSVariable } from '../../global_style';
import Label from '../label';
import ellipsis from '../../style/ellipsis';
import Options from './options';
import { Option } from './constants';
import useEvent from '../../utils/use_event';

const Style = styled.div`
  position: relative;

  transition: inherit;
`;
const Selected = styled.div<{ active: boolean; disabled: boolean }>`
  height: ${ComponentSize.NORMAL}px;
  padding: 0 10px;

  display: flex;
  align-items: center;

  border-width: 1px;
  border-style: solid;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  outline: none;
  transition: inherit;

  > .label {
    flex: 1;
    min-height: 0;

    font-size: 14px;
    ${ellipsis}
    ${capitalize}
  }

  ${({ active, disabled }) => css`
    border-color: ${disabled
      ? CSSVariable.TEXT_COLOR_DISABLED
      : active
      ? CSSVariable.COLOR_PRIMARY
      : CSSVariable.COLOR_BORDER};
    cursor: ${disabled ? 'not-allowed' : 'poiter'};
    color: ${disabled
      ? CSSVariable.TEXT_COLOR_SECONDARY
      : CSSVariable.TEXT_COLOR_PRIMARY};
    background-color: ${disabled
      ? CSSVariable.BACKGROUND_DISABLED
      : 'transparent'};
  `}
`;

function Select<Value>({
  addon,
  label,
  data,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  ...props
}: Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> & {
  addon?: ReactNode;
  label: string;
  data: Option<Value>[];
  value: Option<Value>;
  onChange: (option: Option<Value>) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const onOpen = useEvent(() => {
    if (disabled) {
      return;
    }
    return setOpen(true);
  });

  useEffect(() => {
    if (open) {
      const onClose = () => setOpen(false);
      document.addEventListener('click', onClose, { capture: true });
      return () =>
        document.removeEventListener('click', onClose, { capture: true });
    }
  }, [open]);

  const selected = value
    ? data.find((option) => option.key === value.key)
    : undefined;
  return (
    <Label
      disabled={disabled}
      label={label}
      active={open}
      addon={addon}
      {...props}
    >
      <Style>
        <Selected active={open} disabled={disabled} onClick={onOpen}>
          <div className="label">{selected ? selected.label : placeholder}</div>
          {open ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
        </Selected>
        <Options<Value>
          open={open}
          data={data}
          selected={selected}
          onChange={onChange}
        />
      </Style>
    </Label>
  );
}

export default Select;
