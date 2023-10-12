import { CSSProperties, ComponentProps, useMemo } from 'react';
import Select from 'react-select/async';
import classnames from 'classnames';
import { throttle } from 'lodash';
import {
  ClassName,
  DEFAULT_PLACEHOLDER,
  MultiClassName,
  Option as OptionType,
  StateClassName,
} from './constants';
import LoadingMessage from './loading_message';
import Vacant from './vacant';
import { noOptionsMessage } from './utils';
import DropdownIndicator from './dropdown_indicator';

const classNames: ComponentProps<Select>['classNames'] = {
  container: () => ClassName.CONTAINER,
  menu: () => ClassName.MENU,
  control: ({ isFocused, isDisabled }) =>
    classnames(ClassName.CONTROL, {
      [StateClassName.FOCUSED]: isFocused,
      [StateClassName.DISABLED]: isDisabled,
    }),
  option: () => ClassName.OPTION,
  menuList: () => ClassName.MENU_LIST,
  menuPortal: () => ClassName.MENU_PORTAL,
  multiValue: ({ isDisabled }) =>
    classnames(MultiClassName.MULTI_VALUE, {
      [StateClassName.DISABLED]: isDisabled,
    }),
  multiValueRemove: () => MultiClassName.MULTI_VALUE_REMOVE,
  indicatorSeparator: () => ClassName.INDICATOR_SEPARATOR,
  placeholder: () => ClassName.PLACEHOLDER,
  valueContainer: () => ClassName.VALUE_CONTAINER,
  input: () => ClassName.INPUT,
};

function MultipleSelect<Value>({
  value,
  onChange,
  optionsGetter,
  disabled = false,
  placeholder = DEFAULT_PLACEHOLDER,
  style,
}: {
  value: OptionType<Value>[];
  onChange: (options: OptionType<Value>[]) => void;
  optionsGetter: (search: string) => Promise<OptionType<Value>[]>;
  disabled?: boolean;
  placeholder?: string;
  style?: CSSProperties;
}) {
  const loadOptions = useMemo(
    () =>
      throttle((inputValue: string, callback) => {
        optionsGetter(inputValue).then((options) => callback(options));
      }, 1000),
    [optionsGetter],
  );
  return (
    <Select
      isDisabled={disabled}
      value={value}
      onChange={onChange}
      isMulti
      defaultOptions
      loadOptions={loadOptions}
      noOptionsMessage={noOptionsMessage}
      placeholder={placeholder}
      menuPortalTarget={document.body}
      classNames={classNames}
      isClearable={false}
      components={{
        LoadingIndicator: Vacant,
        LoadingMessage,
        DropdownIndicator,
      }}
      styles={{
        container: (baseStyles) => ({
          ...baseStyles,
          ...style,
        }),
      }}
    />
  );
}

export default MultipleSelect;
