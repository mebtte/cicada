import {
  type CompositionEvent,
  CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactSelect, {
  type StylesConfig,
  type SingleValue,
  type MultiValue,
  type GroupBase,
  components,
  type DropdownIndicatorProps,
  type InputActionMeta,
  type InputProps,
  type MenuProps,
  type MenuPlacement,
} from 'react-select';
import { Branch as DismissableLayerBranch } from '@radix-ui/react-dismissable-layer';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
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
const DISABLED_BACKGROUND = 'rgb(248 248 248)';
const DISABLED_BORDER = 'rgb(226 226 226)';
const DISABLED_SHADOW = CSSVariable.COLOR_DISABLED_SHADOW;

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

// ─── Custom chevron (matches original design) ─────────────────────────────────

function DropdownIndicator<T>(props: DropdownIndicatorProps<SelectOption<T>, boolean, GroupBase<SelectOption<T>>>) {
  const { selectProps } = props;
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

function Menu<T, IsMulti extends boolean>(
  props: MenuProps<SelectOption<T>, IsMulti, GroupBase<SelectOption<T>>>,
) {
  return (
    <components.Menu {...props} />
  );
}

function MenuPortal<T, IsMulti extends boolean>(
  props: Parameters<
    typeof components.MenuPortal<
      SelectOption<T>,
      IsMulti,
      GroupBase<SelectOption<T>>
    >
  >[0],
) {
  return (
    <components.MenuPortal {...props}>
      <DismissableLayerBranch>
        {props.children}
      </DismissableLayerBranch>
    </components.MenuPortal>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────

function buildStyles<T, IsMulti extends boolean>(
  primary: string,
  size: SelectSize,
  isDisabled: boolean,
  isMulti: IsMulti,
  wrapValues = false,
): StylesConfig<SelectOption<T>, IsMulti, GroupBase<SelectOption<T>>> {
  const s = SIZE[size];
  const shadowColor = `color-mix(in srgb, ${primary} 70%, #000)`;
  const optionShadow = Math.max(2, s.shadow - 1);

  return {
    control: (_, state) => ({
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      minHeight: s.height,
      height: !isMulti || (size === 'sm' && !wrapValues) ? s.height : undefined,
      background: '#fff',
      border: `2px solid ${
        isDisabled       ? DISABLED_BORDER   :
        state.isFocused  ? primary          :
        'rgb(220 220 220)'
      }`,
      borderRadius: s.radius,
      boxShadow: isDisabled
        ? `0 ${s.shadow}px 0 ${DISABLED_SHADOW}`
        : state.isFocused
          ? `0 ${s.shadow}px 0 ${shadowColor}`
          : `0 ${s.shadow}px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL}`,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      fontFamily: FONT,
      fontSize: s.font,
      fontWeight: 600,
      letterSpacing: '0.2px',
      backgroundColor: isDisabled ? DISABLED_BACKGROUND : '#fff',
      transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
      outline: 'none',
    }),
    valueContainer: (_, state) => ({
      display:
        isMulti && state.hasValue && state.selectProps.controlShouldRenderValue !== false
          ? 'flex'
          : 'grid',
      flex: 1,
      flexWrap:
        isMulti && (size !== 'sm' || wrapValues)
          ? 'wrap' as const
          : 'nowrap' as const,
      alignItems: 'center',
      padding: `4px ${s.px - 4}px`,
      gap:
        isMulti && state.hasValue && state.selectProps.controlShouldRenderValue !== false
          ? 4
          : 0,
      position: 'relative',
      overflow: 'hidden',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDisabled ? 'rgb(145 145 145)' : 'rgb(55 55 55)',
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
      height: s.height - 4,
      paddingRight: s.px - 10,
      color: isDisabled ? 'rgb(175 175 175)' : undefined,
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
      zIndex: 10000,
      background: '#fff',
      border: '2px solid rgb(220 220 220)',
      borderRadius: Math.max(15, s.radius + 2),
      boxShadow:
        state.placement === 'top'
          ? `0 -4px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL}, 0 14px 28px rgb(0 0 0 / 0.1)`
          : `0 4px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL}, 0 14px 28px rgb(0 0 0 / 0.1)`,
      overflow: 'visible',
      padding: 6,
      marginTop: state.placement === 'top' ? 0 : s.shadow + 6,
      marginBottom: state.placement === 'top' ? s.shadow + 6 : 0,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 10000, pointerEvents: 'auto' }),
    menuList: (_) => ({
      // Keep room inside the scroll clipping area for the last option's hard shadow.
      padding: `0 0 ${optionShadow}px`,
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
        ? `0 ${optionShadow}px 0 ${shadowColor}`
        : state.isFocused
          ? `0 ${optionShadow}px 0 rgb(220 220 220)`
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
          ? `translateY(${optionShadow}px)`
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
      justifyContent: 'center',
      padding: '0 2px 0 8px',
      minHeight: size === 'sm' ? 20 : 24,
      border: '2px solid rgb(220 220 220)',
      borderRadius: 8,
      background: isDisabled ? DISABLED_BACKGROUND : '#fff',
      boxShadow: `0 2px 0 ${isDisabled ? DISABLED_SHADOW : 'rgb(220 220 220)'}`,
      flexShrink: 0,
      maxWidth: wrapValues ? 'min(180px, 100%)' : size === 'sm' ? 84 : 140,
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: isDisabled ? 'rgb(145 145 145)' : 'rgb(66 66 66)',
      fontFamily: FONT,
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 700,
      lineHeight: size === 'sm' ? '14px' : '18px',
      letterSpacing: '0.1px',
      padding: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    multiValueRemove: (_) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
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
      color: CSSVariable.COLOR_CONTROL_NEUTRAL,
      fontWeight: 600,
    }),
    loadingMessage: (_) => ({
      padding: 16,
      textAlign: 'center' as const,
      fontFamily: FONT,
      fontSize: 13,
      color: CSSVariable.COLOR_CONTROL_NEUTRAL,
      fontWeight: 600,
    }),
  };
}

// ─── Select ───────────────────────────────────────────────────────────────────

export interface SelectProps<T> {
  options:      SelectOption<T>[];
  value?:       T;
  onChange?:    (value: T, option: SelectOption<T>) => void;
  menuPlacement?: MenuPlacement;
  disabled?:    boolean;
  size?:        SelectSize;
  label?:       string;
  className?:   string;
  style?:       CSSProperties;
}

export function Select<T>({
  options, value, onChange, menuPlacement = 'auto', disabled = false,
  size = 'md', label, className, style,
}: SelectProps<T>) {
  const inputId = useId();
  const { colorPrimary } = useTheme();
  const styles = useMemo(
    () => buildStyles<T, false>(colorPrimary, size, !!disabled, false),
    [colorPrimary, size, disabled],
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
        isDisabled={disabled}
        isSearchable={false}
        styles={styles}
        getOptionValue={(o) => toKey(o.value)}
        menuPlacement={menuPlacement}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        components={{ DropdownIndicator, Menu, MenuPortal }}
      />
    </Root>
  );
}

// ─── MultiSelect ──────────────────────────────────────────────────────────────

export interface MultiSelectProps<T> {
  loadOptions:  (keyword: string) => Promise<SelectOption<T>[]>;
  value:        SelectOption<T>[];
  onChange?:    (options: SelectOption<T>[]) => void;
  placeholder?: string;
  clearable?:   boolean;
  wrapValues?:  boolean;
  disabled?:    boolean;
  size?:        SelectSize;
  label?:       string;
  /** Label 右侧的附加内容（按钮等） */
  labelAddon?:  ReactNode;
  className?:   string;
  style?:       CSSProperties;
}

export function MultiSelect<T>({
  loadOptions, value, onChange,
  placeholder = 'Select...', clearable, wrapValues = false, disabled = false,
  size = 'md', label, labelAddon, className, style,
}: MultiSelectProps<T>) {
  const inputId = useId();
  const { colorPrimary } = useTheme();
  const composingRef = useRef(false);
  const requestSeqRef = useRef(0);
  const [inputValue, setInputValue] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<SelectOption<T>[]>([]);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const styles = useMemo(
    () =>
      buildStyles<T, true>(
        colorPrimary,
        size,
        !!disabled,
        true,
        wrapValues,
      ),
    [colorPrimary, size, disabled, wrapValues],
  );

  const requestOptions = useCallback(
    (keyword: string) => {
      const seq = requestSeqRef.current + 1;
      requestSeqRef.current = seq;
      setAsyncLoading(true);
      loadOptions(keyword)
        .then((options) => {
          if (requestSeqRef.current === seq) {
            setAsyncOptions(options);
          }
        })
        .catch(() => {
          if (requestSeqRef.current === seq) {
            setAsyncOptions([]);
          }
        })
        .finally(() => {
          if (requestSeqRef.current === seq) {
            setAsyncLoading(false);
          }
        });
    },
    [loadOptions],
  );

  useEffect(() => {
    requestSeqRef.current += 1;
    setInputValue('');
    setAsyncOptions([]);
    setAsyncLoading(false);
  }, [loadOptions]);

  const handleChange = useCallback(
    (opts: MultiValue<SelectOption<T>>) => {
      onChange?.(Array.from(opts));
      setInputValue('');
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (nextValue: string, meta: InputActionMeta) => {
      if (meta.action === 'input-change') {
        setInputValue(nextValue);
        if (!composingRef.current) {
          requestOptions(nextValue);
        }
        return nextValue;
      }

      if (meta.action === 'set-value') {
        setInputValue('');
        return '';
      }

      return inputValue;
    },
    [inputValue, requestOptions],
  );

  const selectComponents = useMemo(
    () => {
      function Input(
        props: InputProps<SelectOption<T>, true, GroupBase<SelectOption<T>>>,
      ) {
        return (
          <components.Input
            {...props}
            onCompositionStart={(
              event: CompositionEvent<HTMLInputElement>,
            ) => {
              props.onCompositionStart?.(event);
              composingRef.current = true;
            }}
            onCompositionEnd={(event: CompositionEvent<HTMLInputElement>) => {
              props.onCompositionEnd?.(event);
              composingRef.current = false;
              const nextValue = event.currentTarget.value;
              setInputValue(nextValue);
              requestOptions(nextValue);
            }}
          />
        );
      }

      return {
        DropdownIndicator,
        Menu,
        MenuPortal,
        Input,
        ...(clearable === false ? { ClearIndicator: () => null } : {}),
      };
    },
    [clearable, requestOptions],
  );

  const sharedProps = {
    inputId,
    isMulti: true as const,
    value,
    onChange: handleChange,
    placeholder,
    ...(clearable === undefined ? {} : { isClearable: clearable }),
    isDisabled: disabled,
    styles,
    getOptionValue: (o: SelectOption<T>) => toKey(o.value),
    menuPortalTarget: document.body,
    menuPosition: 'fixed' as const,
    components: selectComponents,
    closeMenuOnSelect: false,
    blurInputOnSelect: false,
  };

  return (
    <Root className={className} style={style}>
      {(label || labelAddon) && (
        <Label htmlFor={inputId} label={label} addon={labelAddon} />
      )}
      <ReactSelect<SelectOption<T>, true>
        {...sharedProps}
        options={asyncOptions}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        isLoading={asyncLoading}
        filterOption={() => true}
      />
    </Root>
  );
}
