import { t } from '@/i18n';
import { ComponentProps, useMemo } from 'react';
import Select from 'react-select/async';
import capitalize from '#/utils/capitalize';
import { throttle } from 'lodash';
import classnames from 'classnames';
import { ThemeProvider } from 'styled-components';
import theme from '@/global_states/theme';
import { Option as OptionType } from './constants';
import GlobalStyle from './global_style';
import LoadingMessage from './loading_message';
import Vacant from './vacant';

const classNames: ComponentProps<Select>['classNames'] = {
  container: () => 'react-select-multiple-container',
  menu: () => 'react-select-multiple-menu',
  control: ({ isFocused, isDisabled }) =>
    classnames('react-select-multiple-control', {
      focused: isFocused,
      disabled: isDisabled,
    }),
  option: () => 'react-select-multiple-option',
  dropdownIndicator: () => 'react-select-multiple-dropdown-indicator',
  menuList: () => 'react-select-multiple-menu-list',
  menuPortal: () => 'react-select-multiple-menu-portal',
  multiValue: ({ isDisabled }) =>
    classnames('react-select-multiple-multi-value', {
      disabled: isDisabled,
    }),
  multiValueRemove: () => 'react-select-multiple-multi-value-remove',
  indicatorSeparator: () => 'react-select-multiple-indicator-separator',
  placeholder: () => 'react-select-multiple-placeholder',
};
const noOptionsMessage = () => capitalize(t('no_data'));

function MultipleSelect<Value>({
  value,
  onChange,
  optionsGetter,
  disabled = false,
  placeholder = t('select'),
}: {
  value: OptionType<Value>[];
  onChange: (options: OptionType<Value>[]) => void;
  optionsGetter: (
    search: string,
  ) => OptionType<Value>[] | Promise<OptionType<Value>[]>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const loadOptions = useMemo(
    () =>
      throttle((inputValue: string) =>
        Promise.resolve(optionsGetter(inputValue)),
      ),
    [optionsGetter],
  );
  return (
    <ThemeProvider theme={theme.useState()}>
      <GlobalStyle />
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
        isLoading
        components={{
          LoadingIndicator: Vacant,
          LoadingMessage,
        }}
      />
    </ThemeProvider>
  );
}

export default MultipleSelect;
