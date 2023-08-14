import { CSSVariable } from '@/global_style';
import { ComponentProps, CSSProperties } from 'react';
import Select from 'react-select';
import { Option } from './constants';
import './style.scss';

const classNames: ComponentProps<Select>['classNames'] = {
  control: () => 'react-select-single-control',
  option: () => 'react-select-single-option',
};

function Wrapper<Value>({
  value,
  options,
  onChange,
  disabled = false,
  style,
  menuPortalTarget,
}: {
  value: Option<Value>;
  options: Option<Value>[];
  onChange: (option: Option<Value>) => void;
  disabled?: boolean;
  style?: CSSProperties;
  menuPortalTarget?: HTMLElement;
}) {
  return (
    <Select
      isSearchable={false}
      isDisabled={disabled}
      value={value}
      options={options}
      onChange={onChange}
      menuPortalTarget={menuPortalTarget}
      classNames={classNames}
      styles={{
        container: (baseStyles) => ({
          ...baseStyles,
          ...style,
        }),
        control: (baseStyles, { menuIsOpen, isFocused }) => ({
          ...baseStyles,
          color: CSSVariable.TEXT_COLOR_PRIMARY,
          borderColor:
            menuIsOpen || isFocused
              ? `${CSSVariable.COLOR_PRIMARY} !important`
              : `${CSSVariable.COLOR_BORDER} !important`,
        }),
        menu: (baseStyles) => ({
          ...baseStyles,
          fontSize: 14,
          borderRadius: 0,
        }),
        option: (baseStyles, { isSelected, isFocused }) => ({
          ...baseStyles,
          color: isSelected ? '#fff' : CSSVariable.TEXT_COLOR_PRIMARY,
          background: isSelected
            ? CSSVariable.COLOR_PRIMARY
            : isFocused
            ? CSSVariable.BACKGROUND_COLOR_LEVEL_ONE
            : '#fff',
        }),
      }}
    />
  );
}

export default Wrapper;
