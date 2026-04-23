import { CSSProperties, useCallback, useId, useMemo } from 'react';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import ReactSelect, {
  type StylesConfig,
  type SingleValue,
  type GroupBase,
  components,
  type DropdownIndicatorProps,
} from 'react-select';
import AsyncReactSelect from 'react-select/async';
import styled from 'styled-components';
import { useTheme } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectSize = 'sm' | 'md' | 'lg';

export type SelectOption<T = string> = {
  label: string;
  value: T;
};

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE: Record<SelectSize, {
  height: number;
  font:   number;
  radius: number;
  shadow: number;
  px:     number;
}> = {
  sm: { height: 34, font: 13, radius: 10, shadow: 3, px: 12 },
  md: { height: 44, font: 15, radius: 13, shadow: 4, px: 14 },
  lg: { height: 54, font: 17, radius: 16, shadow: 5, px: 18 },
};

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

function toKey<T>(v: T): string {
  return JSON.stringify(v);
}

// ─── Shell layout ─────────────────────────────────────────────────────────────

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const LabelEl = styled.label`
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: rgb(66 66 66);
  user-select: none;
  ${upperCaseFirstLetter}
`;

const Bottom = styled.p<{ $error: boolean }>`
  margin: 0;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: ${({ $error }) => ($error ? 'rgb(242 80 66)' : 'rgb(160 160 160)')};
`;

// ─── Custom chevron (matches original design) ─────────────────────────────────

function DropdownIndicator<T>(props: DropdownIndicatorProps<SelectOption<T>, boolean, GroupBase<SelectOption<T>>>) {
  const { selectProps, innerProps } = props;
  const s = SIZE['md']; // size isn't passed to indicator; use as fallback
  return (
    <components.DropdownIndicator {...props}>
      <svg
        width={14} height={14} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        style={{
          color: 'rgb(175 175 175)',
          transition: 'transform 200ms ease',
          transform: selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </components.DropdownIndicator>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────

function buildStyles<T, IsMulti extends boolean>(
  primary: string,
  size: SelectSize,
  hasError: boolean,
  isDisabled: boolean,
): StylesConfig<SelectOption<T>, IsMulti, GroupBase<SelectOption<T>>> {
  const s = SIZE[size];
  const shadowColor = `color-mix(in srgb, ${primary} 70%, #000)`;

  return {
    control: (_, state) => ({
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      minHeight: s.height,
      background: '#fff',
      border: `2px solid ${
        hasError         ? 'rgb(242 80 66)' :
        state.isFocused  ? primary          :
        'rgb(220 220 220)'
      }`,
      borderRadius: s.radius,
      boxShadow: isDisabled ? 'none' :
        hasError        ? `0 ${s.shadow}px 0 rgb(190 46 34)` :
        state.isFocused ? `0 ${s.shadow}px 0 ${shadowColor}` :
        `0 ${s.shadow}px 0 rgb(185 185 185)`,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      fontFamily: FONT,
      fontSize: s.font,
      fontWeight: 600,
      letterSpacing: '0.2px',
      opacity: isDisabled ? 0.5 : 1,
      transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
      outline: 'none',
    }),
    valueContainer: (_) => ({
      display: 'flex',
      flex: 1,
      flexWrap: 'wrap' as const,
      alignItems: 'center',
      padding: `4px ${s.px - 4}px`,
      gap: 4,
      overflow: 'hidden',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'rgb(55 55 55)',
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: s.font,
      letterSpacing: '0.2px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'rgb(205 205 205)',
      fontFamily: FONT,
      fontWeight: 500,
      fontSize: s.font,
      letterSpacing: '0.2px',
    }),
    indicatorsContainer: (_) => ({
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      paddingRight: s.px - 10,
    }),
    dropdownIndicator: (_) => ({
      display: 'flex',
      alignItems: 'center',
      padding: '0 2px',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    clearIndicator: (_) => ({
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px',
      color: 'rgb(175 175 175)',
      cursor: 'pointer',
    }),
    menu: (_) => ({
      position: 'absolute' as const,
      zIndex: 9000,
      background: '#fff',
      border: '2px solid rgb(220 220 220)',
      borderRadius: s.radius,
      boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
      overflow: 'hidden',
      marginTop: 4,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9000 }),
    menuList: (_) => ({
      padding: 6,
      maxHeight: 248,
      overflowY: 'auto' as const,
    }),
    option: (_, state) => ({
      display: 'flex',
      alignItems: 'center',
      height: Math.round(s.height * 0.82),
      padding: `0 ${s.px}px`,
      borderRadius: s.radius - 4,
      fontFamily: FONT,
      fontSize: s.font,
      fontWeight: 600,
      cursor: 'pointer',
      background: state.isSelected ? primary :
        state.isFocused ? 'rgb(245 245 245)' : 'transparent',
      color: state.isSelected ? '#fff' : 'rgb(55 55 55)',
      transition: 'background 80ms, color 80ms',
    }),
    multiValue: (_) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0 2px 0 8px',
      height: 22,
      borderRadius: 6,
      background: 'rgb(240 240 240)',
      flexShrink: 0,
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'rgb(66 66 66)',
      fontFamily: FONT,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.1px',
      padding: 0,
    }),
    multiValueRemove: (_) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgb(160 160 160)',
      padding: '0 3px',
      marginLeft: 2,
      borderRadius: 3,
      cursor: 'pointer',
    }),
    noOptionsMessage: (_) => ({
      padding: 16,
      textAlign: 'center' as const,
      fontFamily: FONT,
      fontSize: 13,
      color: 'rgb(180 180 180)',
      fontWeight: 600,
    }),
    loadingMessage: (_) => ({
      padding: 16,
      textAlign: 'center' as const,
      fontFamily: FONT,
      fontSize: 13,
      color: 'rgb(180 180 180)',
      fontWeight: 600,
    }),
  };
}

// ─── Select ───────────────────────────────────────────────────────────────────

export interface SelectProps<T> {
  options:      SelectOption<T>[];
  value?:       T;
  onChange?:    (value: T, option: SelectOption<T>) => void;
  placeholder?: string;
  disabled?:    boolean;
  size?:        SelectSize;
  label?:       string;
  hint?:        string;
  error?:       string;
  className?:   string;
  style?:       CSSProperties;
}

export function Select<T>({
  options, value, onChange, placeholder = 'Select...', disabled = false,
  size = 'md', label, hint, error, className, style,
}: SelectProps<T>) {
  const inputId = useId();
  const { colorPrimary } = useTheme();
  const styles = useMemo(
    () => buildStyles<T, false>(colorPrimary, size, !!error, !!disabled),
    [colorPrimary, size, error, disabled],
  );

  const selectedOption = useMemo(
    () => value !== undefined
      ? (options.find((o) => toKey(o.value) === toKey(value)) ?? null)
      : null,
    [options, value],
  );

  const handleChange = useCallback(
    (option: SingleValue<SelectOption<T>>) => {
      if (option) onChange?.(option.value, option);
    },
    [onChange],
  );

  return (
    <Root className={className} style={style}>
      {label && <LabelEl htmlFor={inputId}>{label}</LabelEl>}
      <ReactSelect<SelectOption<T>>
        inputId={inputId}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable={false}
        styles={styles}
        getOptionValue={(o) => toKey(o.value)}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        components={{ DropdownIndicator }}
      />
      {(error || hint) && <Bottom $error={!!error}>{error ?? hint}</Bottom>}
    </Root>
  );
}

// ─── MultiSelect ──────────────────────────────────────────────────────────────

export interface MultiSelectProps<T> {
  options?:     SelectOption<T>[];
  loadOptions?: (keyword: string) => Promise<SelectOption<T>[]>;
  value:        SelectOption<T>[];
  onChange?:    (options: SelectOption<T>[]) => void;
  placeholder?: string;
  disabled?:    boolean;
  size?:        SelectSize;
  label?:       string;
  hint?:        string;
  error?:       string;
  className?:   string;
  style?:       CSSProperties;
}

export function MultiSelect<T>({
  options: staticOptions, loadOptions, value, onChange,
  placeholder = 'Select...', disabled = false,
  size = 'md', label, hint, error, className, style,
}: MultiSelectProps<T>) {
  const inputId = useId();
  const { colorPrimary } = useTheme();
  const styles = useMemo(
    () => buildStyles<T, true>(colorPrimary, size, !!error, !!disabled),
    [colorPrimary, size, error, disabled],
  );

  const handleChange = useCallback(
    (opts: readonly SelectOption<T>[]) => onChange?.(Array.from(opts)),
    [onChange],
  );

  const sharedProps = {
    inputId,
    isMulti: true as const,
    value,
    onChange: handleChange,
    placeholder,
    isDisabled: disabled,
    styles,
    getOptionValue: (o: SelectOption<T>) => toKey(o.value),
    menuPortalTarget: document.body,
    menuPosition: 'fixed' as const,
    components: { DropdownIndicator },
    closeMenuOnSelect: false,
  };

  return (
    <Root className={className} style={style}>
      {label && <LabelEl htmlFor={inputId}>{label}</LabelEl>}
      {loadOptions ? (
        <AsyncReactSelect<SelectOption<T>, true>
          {...sharedProps}
          loadOptions={loadOptions}
          defaultOptions
          cacheOptions
        />
      ) : (
        <ReactSelect<SelectOption<T>, true>
          {...sharedProps}
          options={staticOptions ?? []}
        />
      )}
      {(error || hint) && <Bottom $error={!!error}>{error ?? hint}</Bottom>}
    </Root>
  );
}
