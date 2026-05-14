import { CSSProperties, useCallback, useId, useMemo } from 'react';
import ReactSelect, {
  type StylesConfig,
  type SingleValue,
  type GroupBase,
  components,
  type DropdownIndicatorProps,
  type MenuPlacement,
} from 'react-select';
import AsyncReactSelect from 'react-select/async';
import styled from 'styled-components';
import Label from '../label';
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
  isMulti: IsMulti,
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
      flexWrap: isMulti ? 'wrap' as const : 'nowrap' as const,
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
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
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
    menu: (base, state) => ({
      ...base,
      zIndex: 9000,
      background: '#fff',
      border: '2px solid rgb(220 220 220)',
      borderRadius: Math.max(15, s.radius + 2),
      boxShadow:
        state.placement === 'top'
          ? '0 -4px 0 rgb(185 185 185), 0 14px 28px rgb(0 0 0 / 0.1)'
          : '0 4px 0 rgb(185 185 185), 0 14px 28px rgb(0 0 0 / 0.1)',
      overflow: 'visible',
      padding: 6,
      marginTop: state.placement === 'top' ? 0 : s.shadow + 6,
      marginBottom: state.placement === 'top' ? s.shadow + 6 : 0,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9000 }),
    menuList: (_) => ({
      padding: 0,
      maxHeight: 248,
      overflowY: 'auto' as const,
      scrollbarWidth: 'thin' as const,
    }),
    option: (_, state) => ({
      display: 'flex',
      alignItems: 'center',
      minHeight: Math.max(30, Math.round(s.height * 0.88)),
      padding: `0 ${s.px}px`,
      marginTop: state.isSelected || state.isFocused ? 0 : 0,
      border: `2px solid ${
        state.isSelected ? shadowColor : state.isFocused ? 'rgb(220 220 220)' : 'transparent'
      }`,
      borderRadius: Math.max(10, s.radius),
      boxShadow: state.isSelected
        ? `0 ${Math.max(2, s.shadow - 1)}px 0 ${shadowColor}`
        : state.isFocused
          ? `0 ${Math.max(2, s.shadow - 1)}px 0 rgb(220 220 220)`
          : 'none',
      fontFamily: FONT,
      fontSize: s.font,
      fontWeight: 800,
      letterSpacing: 0,
      cursor: 'pointer',
      background: state.isSelected ? primary : '#fff',
      color: state.isSelected ? '#fff' : 'rgb(55 55 55)',
      transition:
        'background 120ms, border-color 120ms, box-shadow 120ms, color 120ms',
      ':active': {
        transform: state.isSelected || state.isFocused
          ? `translateY(${Math.max(2, s.shadow - 1)}px)`
          : undefined,
        boxShadow: 'none',
      },
      ':not(:first-of-type)': {
        marginTop: 6,
      },
    }),
    multiValue: (_) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0 2px 2px 8px',
      minHeight: 24,
      border: '2px solid rgb(220 220 220)',
      borderRadius: 8,
      background: '#fff',
      boxShadow: '0 2px 0 rgb(220 220 220)',
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
  menuPlacement?: MenuPlacement;
  disabled?:    boolean;
  size?:        SelectSize;
  label?:       string;
  hint?:        string;
  error?:       string;
  className?:   string;
  style?:       CSSProperties;
}

export function Select<T>({
  options, value, onChange, placeholder = 'Select...', menuPlacement = 'auto', disabled = false,
  size = 'md', label, hint, error, className, style,
}: SelectProps<T>) {
  const inputId = useId();
  const { colorPrimary } = useTheme();
  const styles = useMemo(
    () => buildStyles<T, false>(colorPrimary, size, !!error, !!disabled, false),
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
      {label && <Label htmlFor={inputId}>{label}</Label>}
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
        menuPlacement={menuPlacement}
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
    () => buildStyles<T, true>(colorPrimary, size, !!error, !!disabled, true),
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
      {label && <Label htmlFor={inputId}>{label}</Label>}
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
