import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import { CSSVariable } from '../../global_style';
import { Option as OptionType } from './constants';

const Style = styled(animated.div)`
  z-index: 1;

  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  width: 100%;

  transform-origin: top;
  background-color: #fff;
  box-shadow: rgb(0 0 0 / 20%) 0px 5px 5px -3px,
    rgb(0 0 0 / 14%) 0px 8px 10px 1px, rgb(0 0 0 / 12%) 0px 3px 14px 2px;
`;
const Option = styled.div<{ active: boolean }>`
  padding: 5px 10px;

  cursor: pointer;
  transition: 300ms;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.15);
  }

  ${({ active }) => css`
    color: ${active ? '#fff !important' : CSSVariable.TEXT_COLOR_PRIMARY};
    background-color: ${active
      ? `${CSSVariable.COLOR_PRIMARY} !important`
      : 'transparent'};
  `}
`;

function Options<Value>({
  open,
  data,
  selected,
  onChange,
}: {
  open: boolean;
  data: OptionType<Value>[];
  selected?: OptionType<Value>;
  onChange: (option: OptionType<Value>) => void;
}) {
  const transitions = useTransition(open, {
    from: {
      opacity: 0,
      transform: 'scaleY(0)',
    },
    enter: {
      opacity: 1,
      transform: 'scaleY(1)',
    },
    leave: {
      opacity: 0,
      transform: 'scaleY(0)',
    },
  });
  return transitions((style, o) =>
    o ? (
      <Style style={style}>
        {data.map((option) => (
          <Option
            key={option.key}
            active={option.key === selected?.key}
            onClick={() => onChange(option)}
          >
            {option.label}
          </Option>
        ))}
      </Style>
    ) : null,
  );
}

export default Options;
