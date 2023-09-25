import { CSSVariable } from '@/global_style';
import { ComponentProps, CSSProperties } from 'react';
import { ComponentSize } from '@/constants/style';
import Select from 'react-select';
import { t } from '@/i18n';
import { Option } from './constants';
import './style.scss';

const classNames: ComponentProps<Select>['classNames'] = {
  control: () => 'react-select-single-control',
  option: () => 'react-select-single-option',
  indicatorsContainer: () => 'react-select-single-indicator-container',
};
const noOptionsMessage = () => t('no_data');

function Wrapper<Value>({
  value,
  options,
  onChange,
  disabled = false,
  style,
  menuPortalTarget,
  placeholder = t('select'),
}: {
  value?: Option<Value>;
  options: Option<Value>[];
  onChange: (option: Option<Value>) => void;
  disabled?: boolean;
  style?: CSSProperties;
  menuPortalTarget?: HTMLElement;
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
      menuPortalTarget={menuPortalTarget}
      classNames={classNames}
      styles={{
        container: (baseStyles) => ({
          ...baseStyles,
          ...style,
        }),
        control: (baseStyles, { menuIsOpen, isFocused, isDisabled }) => ({
          ...baseStyles,
          color: CSSVariable.TEXT_COLOR_PRIMARY,
          borderColor: isDisabled
            ? `${CSSVariable.TEXT_COLOR_DISABLED} !important`
            : menuIsOpen || isFocused
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
        valueContainer: (baseStyles) => ({
          ...baseStyles,
          height: ComponentSize.NORMAL,
        }),
      }}
    />
  );
}

export default Wrapper;
