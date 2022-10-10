import {
  FocusEventHandler,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import styled, { css } from 'styled-components';
import { MdClose } from 'react-icons/md';
import { CSSVariable } from '../../global_style';
import Label from '../label';
import { Item as ItemType } from './constants';
import ellipsis from '../../style/ellipsis';
import Options from './options';
import notice from '../../utils/notice';
import e, { EventType } from './eventemitter';
import useOptions from './use_options';
import useEvent from '../../utils/use_event';

const onGetDataErrorDefault = (error: Error) => notice.error(error.message);
const Style = styled.div`
  position: relative;
`;
const Input = styled.div<{ active: boolean }>`
  padding: 5px 10px;

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;

  cursor: pointer;
  border: 1px solid;
  border-radius: 4px;
  transition: inherit;

  > .input {
    flex: 1;
    min-width: 30px;

    border: none;
    outline: none;
    font-size: 14px;
  }

  ${({ active }) => css`
    border-color: ${active
      ? CSSVariable.COLOR_PRIMARY
      : CSSVariable.COLOR_BORDER};

    > .input {
      color: ${active ? CSSVariable.TEXT_COLOR_PRIMARY : 'transparent'};
    }
  `}
`;
const Item = styled.div`
  max-width: 100%;
  padding: 3px 3px 3px 7px;

  border-radius: 2px;
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  cursor: default;

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
  onGetDataError = onGetDataErrorDefault,
  emptyMesssage = '暂无数据',
}: {
  label: string;
  value: ItemType<ID>[];
  onChange: (value: ItemType<ID>[]) => void;
  dataGetter: (search: string) => ItemType<ID>[] | Promise<ItemType<ID>[]>;
  onGetDataError?: (error: Error) => void;
  emptyMesssage?: string;
}) {
  const id = useId();

  const [keyword, setKeyword] = useState('');

  const [open, setOpen] = useState(false);

  const timerRef = useRef(0);
  const onFocus: FocusEventHandler<HTMLInputElement> = useEvent(() => {
    window.clearTimeout(timerRef.current);
    return setOpen(true);
  });
  const onBlur: FocusEventHandler<HTMLInputElement> = useEvent(() => {
    timerRef.current = window.setTimeout(() => setOpen(false), 200);
  });
  const onRemove = useCallback(
    (item: ItemType<ID>) => onChange(value.filter((i) => i.id !== item.id)),
    [onChange, value],
  );

  const { loading, options } = useOptions({
    keyword,
    dataGetter,
    onGetDataError,
  });

  useEffect(() => {
    const unlistenOnChange = e.listen(
      EventType.ON_CHANGE,
      ({ id: emitId, item }) => {
        if (id !== emitId) {
          return;
        }
        const included = value.some((i) => i.id === item.id);
        return onChange(
          included
            ? value.filter((i) => i.id !== item.id)
            : [...value, item as ItemType<ID>],
        );
      },
    );
    return unlistenOnChange;
  }, [id, onChange, value]);

  const selectedIds = value.map((i) => i.id);
  return (
    <Label label={label} active={open}>
      <Style>
        <Input active={open}>
          {value.map((item) => (
            <Item key={item.id}>
              <div className="label">{item.label}</div>
              <MdClose onClick={() => onRemove(item)} />
            </Item>
          ))}
          <input
            className="input"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </Input>
        <Options
          id={id}
          open={open}
          loading={loading}
          options={options}
          selectedIds={selectedIds}
          emptyMesssage={emptyMesssage}
        />
      </Style>
    </Label>
  );
}

export default MultipleSelect;
