import styled, { css } from 'styled-components';
import ResizeObserver from 'resize-observer-polyfill';
import { MdDone } from 'react-icons/md';
import { animated, useTransition } from 'react-spring';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { UtilZIndex } from '../../constants/style';
import { Option as OptionType } from './constants';
import Spinner from '../spinner';
import { flexCenter } from '../../style/flexbox';
import { CSSVariable } from '../../global_style';
import e, { EventType } from './eventemitter';
import ellipsis from '../../style/ellipsis';

const Mask = styled.div`
  z-index: ${UtilZIndex.MULTIPLE_SELECT};

  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;
const Style = styled(animated.div)`
  position: absolute;

  background-color: #fff;
  box-shadow: rgb(0 0 0 / 20%) 0px 5px 5px -3px,
    rgb(0 0 0 / 14%) 0px 8px 10px 1px, rgb(0 0 0 / 12%) 0px 3px 14px 2px;
  transform-origin: top;

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
interface BaseProps<Value> {
  id: string;
  loading: boolean;
  options: OptionType<Value>[];
  selectedKeys: (number | string)[];
  emptyMesssage: string;
}

function Options<Value>({
  style,
  loading,
  options,
  selectedKeys,
  id,
  emptyMesssage,
  anchor,
}: BaseProps<Value> & { style: unknown; anchor: HTMLDivElement }) {
  const [rect, setRect] = useState(() => anchor.getBoundingClientRect());

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() =>
      setRect(anchor.getBoundingClientRect()),
    );
    resizeObserver.observe(anchor);
    return () => resizeObserver.disconnect();
  }, [anchor]);

  return ReactDOM.createPortal(
    <Mask>
      <Style
        style={{
          // @ts-expect-error
          ...style,
          top: rect.top + rect.height + 2,
          left: rect.left,
          width: rect.width,
        }}
      >
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
    </Mask>,
    document.body,
  );
}

function Wrapper<Value>({
  anchor,
  ...props
}: BaseProps<Value> & {
  anchor: HTMLDivElement | null;
}) {
  const transitions = useTransition(anchor, {
    from: {
      opacity: 0,
      transform: `scaleY(0%)`,
    },
    enter: {
      opacity: 1,
      transform: `scaleY(100%)`,
    },
    leave: {
      opacity: 0,
      transform: `scaleY(0%)`,
    },
  });

  return transitions((style, a) =>
    a ? <Options style={style} anchor={a} {...props} /> : null,
  );
}

export default Wrapper;
