import styled, { css } from 'styled-components';
import { MdDone } from 'react-icons/md';
import { HtmlHTMLAttributes } from 'react';
import { Option as OptionType } from './constants';
import Spinner from '../spinner';
import { flexCenter } from '../../style/flexbox';
import { CSSVariable } from '../../global_style';
import e, { EventType } from './eventemitter';
import ellipsis from '../../style/ellipsis';

const OPTION_HEIGHT = 36;
const Style = styled.div`
  position: fixed;
  z-index: 1;

  margin-top: 5px;

  background-color: #fff;
  box-shadow: rgb(0 0 0 / 20%) 0px 5px 5px -3px,
    rgb(0 0 0 / 14%) 0px 8px 10px 1px, rgb(0 0 0 / 12%) 0px 3px 14px 2px;
  transform-origin: top;

  > .list {
    display: block;
    max-height: ${OPTION_HEIGHT * 5}px;
    overflow: auto;
  }
`;
const Option = styled.div<{ selected: boolean }>`
  height: ${OPTION_HEIGHT}px;
  padding: 0 10px;

  display: flex;
  align-items: center;
  gap: 10px;

  cursor: pointer;
  transition: 300ms;
  border-bottom: 1px solid transparent;
  background-clip: padding-box;

  > .label {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    ${ellipsis}
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.15);
  }

  ${({ selected }) => css`
    color: ${selected ? '#fff !important' : CSSVariable.TEXT_COLOR_PRIMARY};
    background-color: ${selected
      ? `${CSSVariable.COLOR_PRIMARY} !important`
      : 'transparent'};
  `}
`;
const Loader = styled.div`
  padding: 10px 20px;
  ${flexCenter}
`;
const Empty = styled.div`
  padding: 10px 20px;
  line-height: 1;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-align: center;
`;
interface BaseProps<Value> {
  id: string;
  loading: boolean;
  options: OptionType<Value>[];
  selectedKeys: (number | string)[];
  emptyMesssage: string;
}

function Options<Value>({
  loading,
  options,
  selectedKeys,
  id,
  emptyMesssage,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & BaseProps<Value>) {
  return (
    <Style {...props}>
      {loading ? (
        <Loader>
          <Spinner size={16} />
        </Loader>
      ) : null}
      {options.length ? (
        <label
          className="list"
          // htmlFor={id}
          // onMouseDown={(event) => event.preventDefault()}
        >
          {options.map((option) => {
            const selected = selectedKeys.includes(option.key);
            return (
              <Option
                key={option.key}
                selected={selected}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => e.emit(EventType.ON_CHANGE, { id, option })}
              >
                <div className="label">{option.label}</div>
                {selected ? <MdDone /> : null}
              </Option>
            );
          })}
        </label>
      ) : loading ? null : (
        <Empty>{emptyMesssage}</Empty>
      )}
    </Style>
  );
}

export default Options;
