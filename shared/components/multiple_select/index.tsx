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
  transition: inherit;
`;
const Input = styled.div<{ active: boolean; disabled: boolean }>`
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

    &:disabled {
      background-color: transparent;
    }
  }

  ${({ active, disabled }) => css`
    border-color: ${disabled
      ? CSSVariable.TEXT_COLOR_DISABLED
      : active
      ? CSSVariable.COLOR_PRIMARY
      : CSSVariable.COLOR_BORDER};
    background: ${disabled ? CSSVariable.BACKGROUND_DISABLED : 'transparent'};
    cursor: ${disabled ? 'not-allowed' : 'pointer'};

    > .input {
      color: ${active ? CSSVariable.TEXT_COLOR_PRIMARY : 'transparent'};
    }
  `}
`;
const Item = styled.div<{ disabled: boolean }>`
  max-width: 100%;
  padding: 3px 3px 3px 7px;

  border-radius: 2px;
  border: 1px solid ${CSSVariable.COLOR_BORDER};
  cursor: default;

  display: flex;
  align-items: center;
  gap: 3px;

  > .label {
    font-size: 12px;
    line-height: 1;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > svg {
    width: 16px;
    flex-shrink: 0;
  }

  ${({ disabled }) => css`
    > svg {
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      color: ${disabled
        ? CSSVariable.TEXT_COLOR_DISABLED
        : CSSVariable.TEXT_COLOR_PRIMARY};
    }
  `}
`;

function MultipleSelect<ID extends number | string>({
  label,
  value,
  onChange,
  dataGetter,
  onGetDataError = onGetDataErrorDefault,
  emptyMesssage = '暂无数据',
  disabled = false,
}: {
  label: string;
  value: ItemType<ID>[];
  onChange: (value: ItemType<ID>[]) => void;
  dataGetter: (search: string) => ItemType<ID>[] | Promise<ItemType<ID>[]>;
  onGetDataError?: (error: Error) => void;
  emptyMesssage?: string;
  disabled?: boolean;
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
    (item: ItemType<ID>) => {
      if (disabled) {
        return;
      }
      return onChange(value.filter((i) => i.id !== item.id));
    },
    [disabled, onChange, value],
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
    <Label label={label} active={open} disabled={disabled}>
      <Style>
        <Input active={open} disabled={disabled}>
          {value.map((item) => (
            <Item key={item.id} disabled={disabled}>
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
            disabled={disabled}
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
