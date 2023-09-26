import { FocusEventHandler, useState } from 'react';
import styled, { css } from 'styled-components';
import { t } from '@/i18n';
import { CSSVariable } from '../../global_style';
import { Option as OptionType } from './constants';
import ValueItem from './value';
import Options from './options';
import useEvent from '../../utils/use_event';

const Input = styled.div<{ active: boolean; disabled: boolean }>`
  padding: 5px 10px;

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;

  cursor: pointer;
  border: 1px solid;
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

function MultipleSelect<Value>({
  value,
  onChange,
  optionsGetter,
  emptyMesssage = t('no_data'),
  disabled = false,
}: {
  value: OptionType<Value>[];
  onChange: (options: OptionType<Value>[]) => void;
  optionsGetter: (
    search: string,
  ) => OptionType<Value>[] | Promise<OptionType<Value>[]>;
  emptyMesssage?: string;
  disabled?: boolean;
}) {
  const [keyword, setKeyword] = useState('');
  const [active, setActive] = useState(false);

  const onFocus: FocusEventHandler<HTMLInputElement> = useEvent(() =>
    setActive(true),
  );
  const onBlur: FocusEventHandler<HTMLInputElement> = useEvent(() =>
    setActive(false),
  );

  const onChangeWrapper = (option: OptionType<Value>) => {
    const included = value.some((i) => i.key === option.key);
    return onChange(
      included
        ? value.filter((i) => i.key !== option.key)
        : [...value, option as OptionType<Value>],
    );
  };
  const onRemove = (option: OptionType<Value>) =>
    onChange(value.filter((i) => i.key !== option.key));

  const selectedKeys = value.map((i) => i.key);
  return (
    <>
      <Input active={active} disabled={disabled}>
        {value.map((option) => (
          <ValueItem
            key={option.key}
            option={option}
            disabled={disabled}
            onRemove={() => onRemove(option)}
          />
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
      {active ? (
        <Options
          className="options"
          keyword={keyword}
          optionsGetter={optionsGetter}
          selectedKeys={selectedKeys}
          emptyMesssage={emptyMesssage}
          onChange={onChangeWrapper}
        />
      ) : null}
    </>
  );
}

export default MultipleSelect;
