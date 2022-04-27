import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import Input from '../input';
import CircularLoader from '../circular_loader';
import Icon, { Name } from '../icon';

const ANIMATION_DURATION = 350;
const ARROW_SIZE = 10;
const Style = styled.div<{ arrayVisible: boolean }>`
  position: relative;
  display: inline-block;
  > .input-box {
    position: relative;
    > .input {
      width: 100%;
    }
    > .arrow {
      pointer-events: none;
      position: absolute;
      right: 12px;
      top: calc(50% - ${ARROW_SIZE / 2}px);
      color: rgb(155 155 155);
    }
  }
  > .array {
    z-index: 1;
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 100%;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0px 0px 15px rgb(0 0 0 / 15%);
    transition: ${ANIMATION_DURATION}ms;
    &::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 10px;
      border-width: 6px;
      border-style: solid;
      border-color: transparent transparent #fff transparent;
    }
    > .loading {
      padding: 12px;
    }
    > .list {
      border-radius: 4px;
      max-height: 300px;
      overflow: auto;
      ${scrollbarAsNeeded}
      &:empty::after {
        content: '空';
        display: block;
        font-size: 12px;
        padding: 10px 12px;
        color: rgb(155 155 155);
        cursor: not-allowed;
      }
    }
  }
  ${({ arrayVisible }) => css`
    > .array {
      opacity: ${arrayVisible ? 1 : 0};
      transform: translate(0, ${arrayVisible ? 0 : '32px'});
      pointer-events: ${arrayVisible ? 'auto' : 'none'};
    }
  `}
`;
const StyledItem = styled.div<{ active: boolean }>`
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: ${ANIMATION_DURATION}ms;
  &:hover {
    background-color: rgb(49 194 124 / 0.05);
  }
  ${({ active }) => css`
    background-color: ${active ? 'var(--color-primary) !important' : '#fff'};
    color: ${active ? '#fff' : '#333'};
  `}
`;

function Select<Item>({
  value,
  onChange,
  array,
  itemRenderer,
  customInputDisabled = false,
  onInputChange,
  loading = false,
  placeholder,
  disabled,
  ...props
}: {
  value: Item | null;
  onChange: (item: Item) => void;
  array: Item[];
  itemRenderer: (item: Item | null, customInput: string) => string;
  customInputDisabled?: boolean;
  onInputChange?: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const [customInput, setCustomInput] = useState('');
  const onCustomInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setCustomInput(event.target.value);

  const [arrayVisible, setArrayVisible] = useState(false);
  const onFocus = () => setArrayVisible(true);
  const onBlur = () =>
    window.setTimeout(() => setArrayVisible(false), ANIMATION_DURATION);

  useEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    onInputChange && onInputChange(customInput);
  }, [onInputChange, customInput]);

  return (
    <Style {...props} arrayVisible={arrayVisible}>
      <div className="input-box">
        <Input
          className="input"
          readOnly={customInputDisabled}
          value={
            // eslint-disable-next-line no-nested-ternary
            arrayVisible
              ? customInput
              : value !== null
              ? itemRenderer(value, '')
              : ''
          }
          onChange={onCustomInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
        />
        {arrayVisible ? null : (
          <Icon className="arrow" name={Name.DOWN_OUTLINE} size={ARROW_SIZE} />
        )}
      </div>
      <div className="array">
        {loading ? (
          <div className="loading">
            <CircularLoader />
          </div>
        ) : (
          <div className="list">
            {array.map((item, index) => {
              const target = itemRenderer(item, customInput);
              if (!target) {
                return null;
              }
              return (
                <StyledItem
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  active={value === item}
                  onClick={() => onChange(item)}
                >
                  {target}
                </StyledItem>
              );
            })}
          </div>
        )}
      </div>
    </Style>
  );
}

export default Select;
