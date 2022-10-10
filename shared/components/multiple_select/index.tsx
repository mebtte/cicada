import { FocusEventHandler, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { MdClose } from 'react-icons/md';
import { CSSVariable } from '../../global_style';
import Label from '../label';
import { Item as ItemType } from './constants';
import ellipsis from '../../style/ellipsis';
import Options from './options';
import notice from '../../utils/notice';

const Style = styled.div`
  position: relative;
`;
const Input = styled.div<{ active: boolean }>`
  padding: 5px 10px;

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;

  border: 1px solid;
  border-radius: 4px;
  transition: inherit;

  > .input {
    flex: 1;
    min-width: 30px;

    border: none;
    outline: none;
    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }

  ${({ active }) => css`
    border-color: ${active
      ? CSSVariable.COLOR_PRIMARY
      : CSSVariable.COLOR_BORDER};
  `}
`;
const Item = styled.div`
  max-width: 100%;
  padding: 3px 3px 3px 7px;

  border-radius: 2px;
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};

  display: flex;
  align-items: center;
  gap: 3px;

  > .label {
    font-size: 12px;
    line-height: 1;
    ${ellipsis}
  }

  > svg {
    width: 16px;
    flex-shrink: 0;

    cursor: pointer;
  }
`;

function MultipleSelect<ID extends number | string>({
  label,
  value,
  onChange,
  dataGetter,
  onGetDataError = (error) => notice.error(error.message),
}: {
  label: string;
  value: ItemType<ID>[];
  onChange: (value: ItemType<ID>[]) => void;
  dataGetter: (search: string) => ItemType<ID>[] | Promise<ItemType<ID>[]>;
  onGetDataError?: (error: Error) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const makeFocus = () => inputRef.current?.focus();

  const [open, setOpen] = useState(false);
  const onFocus: FocusEventHandler<HTMLInputElement> = () =>
    window.setTimeout(() => setOpen(true), 0);
  const onBlur: FocusEventHandler<HTMLInputElement> = () => setOpen(false);
  const onRemove = (item: ItemType<ID>) =>
    onChange(value.filter((i) => i.id !== item.id));

  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {}, 1000);
    return () => window.clearTimeout(timer);
  }, [keyword, dataGetter]);

  useEffect(() => {
    if (open) {
      const onClose = () => setOpen(false);
      document.addEventListener('click', onClose, { capture: true });
      return () =>
        document.removeEventListener('click', onClose, { capture: true });
    }
  }, [open]);

  return (
    <Label label={label} active={open}>
      <Style>
        <Input onClick={makeFocus} active={open}>
          {value.map((item) => (
            <Item key={item.id}>
              <div className="label">{item.label}</div>
              <MdClose onClick={() => onRemove(item)} />
            </Item>
          ))}
          <input
            className="input"
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </Input>
        <Options
          open={open}
          keyword={keyword}
          dataGetter={dataGetter}
          onGetDataError={onGetDataError}
        />
      </Style>
    </Label>
  );
}

export default MultipleSelect;
