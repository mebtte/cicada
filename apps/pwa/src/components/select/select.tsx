import { ComponentProps, CSSProperties } from 'react';
import Select from 'react-select';
import classnames from 'classnames';
import {
  ClassName,
  DEFAULT_PLACEHOLDER,
  Option,
  SingleClassName,
  StateClassName,
} from './constants';
import { noOptionsMessage } from './utils';
import DropdownIndicator from './dropdown_indicator';

const classNames: ComponentProps<Select>['classNames'] = {
  container: () => ClassName.CONTAINER,
  menu: () => ClassName.MENU,
  control: ({ isFocused }) =>
    classnames(ClassName.CONTROL, {
      [StateClassName.FOCUSED]: isFocused,
    }),
  option: ({ isSelected }) =>
    classnames(ClassName.OPTION, {
      [StateClassName.SELECTED]: isSelected,
    }),
  menuPortal: () => ClassName.MENU_PORTAL,
  indicatorSeparator: () => ClassName.INDICATOR_SEPARATOR,
  menuList: () => ClassName.MENU_LIST,
  singleValue: () => SingleClassName.SINGLE_VALUE,
  placeholder: () => ClassName.PLACEHOLDER,
  valueContainer: () => ClassName.VALUE_CONTAINER,
};

function Wrapper<Value>({
  value,
  options,
  onChange,
  disabled = false,
  style,
  placeholder = DEFAULT_PLACEHOLDER,
}: {
  value?: Option<Value>;
  options: Option<Value>[];
  onChange: (option: Option<Value>) => void;
  disabled?: boolean;
  style?: CSSProperties;
  placeholder?: string;
}) {
  return (
    <Select
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      isSearchable={false}
      isDisabled={disabled}
      value={value}
      options={options}
      onChange={onChange}
      menuPortalTarget={document.body}
      classNames={classNames}
      components={{
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

export default Wrapper;
