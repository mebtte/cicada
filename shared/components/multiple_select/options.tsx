import styled, { css } from 'styled-components';
import { MdDone } from 'react-icons/md';
import { animated, useTransition } from 'react-spring';
import { ComponentSize } from '../../constants/style';
import { Option as OptionType } from './constants';
import Spinner from '../spinner';
import { flexCenter } from '../../style/flexbox';
import { CSSVariable } from '../../global_style';
import e, { EventType } from './eventemitter';
import ellipsis from '../../style/ellipsis';

const Style = styled(animated.div)`
  z-index: 1;

  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  width: 100%;

  overflow: hidden;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: rgb(0 0 0 / 20%) 0px 5px 5px -3px,
    rgb(0 0 0 / 14%) 0px 8px 10px 1px, rgb(0 0 0 / 12%) 0px 3px 14px 2px;

  > .list {
    max-height: 200px;
    overflow: auto;
  }
`;
const Option = styled.div<{ selected: boolean }>`
  padding: 5px 10px;

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
  padding: 10px 0;
  ${flexCenter}
`;
const Empty = styled.div`
  padding: 20px 0;
  line-height: 1;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-align: center;
`;

function Options<Value>({
  id,
  open,
  loading,
  options,
  selectedKeys,
  emptyMesssage,
}: {
  id: string;
  open: boolean;
  loading: boolean;
  options: OptionType<Value>[];
  selectedKeys: string[];
  emptyMesssage: string;
}) {
  const transitions = useTransition(open, {
    from: {
      opacity: 0,
      transform: `translateY(${ComponentSize.NORMAL}px)`,
    },
    enter: {
      opacity: 1,
      transform: 'translateY(0px)',
    },
    leave: {
      opacity: 0,
      transform: `translateY(${ComponentSize.NORMAL}px)`,
    },
  });

  return transitions((style, o) =>
    o ? (
      <Style style={style}>
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
                  onClickCapture={() =>
                    e.emit(EventType.ON_CHANGE, { id, option })
                  }
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
      </Style>
    ) : null,
  );
}

export default Options;
