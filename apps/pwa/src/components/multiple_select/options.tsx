import styled, { css } from 'styled-components';
import { MdDone } from 'react-icons/md';
import { CSSProperties, HtmlHTMLAttributes } from 'react';
import ErrorCard from '@/components/error_card';
import preventDefault from '@/utils/prevent_default';
import { Option as OptionType } from './constants';
import Spinner from '../spinner';
import { flexCenter } from '../../style/flexbox';
import { CSSVariable } from '../../global_style';
import ellipsis from '../../style/ellipsis';
import useOptions from './use_options';

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
const errorCardStyle: CSSProperties = {
  padding: '20px 30px',
};

function Options<Value>({
  keyword,
  selectedKeys,
  emptyMesssage,
  optionsGetter,
  onChange,
  ...props
}: Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> & {
  keyword: string;
  selectedKeys: (number | string)[];
  emptyMesssage: string;
  optionsGetter: (
    search: string,
  ) => OptionType<Value>[] | Promise<OptionType<Value>[]>;
  onChange: (option: OptionType<Value>) => void;
}) {
  const { error, loading, options, reload } = useOptions({
    keyword,
    optionsGetter,
  });
  return (
    <Style
      {...props}
      // prevent input from losing focus
      onPointerDown={preventDefault}
    >
      {error ? (
        <ErrorCard
          errorMessage={error.message}
          retry={reload}
          style={errorCardStyle}
        />
      ) : (
        <>
          {loading ? (
            <Loader>
              <Spinner size={16} />
            </Loader>
          ) : null}
          {options.length ? (
            <div className="list">
              {options.map((option) => {
                const selected = selectedKeys.includes(option.key);
                return (
                  <Option
                    key={option.key}
                    selected={selected}
                    onClick={() => onChange(option)}
                  >
                    <div className="label">{option.label}</div>
                    {selected ? <MdDone /> : null}
                  </Option>
                );
              })}
            </div>
          ) : loading ? null : (
            <Empty>{emptyMesssage}</Empty>
          )}
        </>
      )}
    </Style>
  );
}

export default Options;
