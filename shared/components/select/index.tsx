import { HtmlHTMLAttributes, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { ComponentSize } from '../../constants/style';
import { CSSVariable } from '../../global_style';
import Label from '../label';
import ellipsis from '../../style/ellipsis';
import Options from './options';
import { Item } from './constants';

const Style = styled.div`
  position: relative;

  transition: inherit;
`;
const Selected = styled.div<{ active: boolean }>`
  height: ${ComponentSize.NORMAL}px;
  padding: 0 10px;

  display: flex;
  align-items: center;

  cursor: pointer;
  border-radius: 4px;
  border-radius: 4px;
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
  }

  ${({ active }) => css`
    border-color: ${active
      ? CSSVariable.COLOR_PRIMARY
      : CSSVariable.COLOR_BORDER};
  `}
`;

function Select<ID extends number | string>({
  label,
  data,
  value,
  onChange,
  placeholder = '',
  disabled = false,
}: Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> & {
  label: string;
  data: Item<ID>[];
  value: ID;
  onChange: (id: ID) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const onClose = () => setOpen(false);
      document.addEventListener('click', onClose, { capture: true });
      return () =>
        document.removeEventListener('click', onClose, { capture: true });
    }
  }, [open]);

  const selected = value ? data.find((item) => item.id === value) : undefined;
  return (
    <Label disabled={disabled} label={label} active={open}>
      <Style>
        <Selected active={open} onClick={() => setOpen(true)}>
          <div className="label">{selected ? selected.label : placeholder}</div>
          {open ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
        </Selected>
        <Options<ID>
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
