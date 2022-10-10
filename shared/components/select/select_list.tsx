import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import { ComponentSize } from '../../constants/style';
import { CSSVariable } from '../../global_style';
import { Item as ItemType } from './constants';

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
`;
const Item = styled.div<{ active: boolean }>`
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

function SelectList<ID extends number | string>({
  open,
  data,
  selected,
  onChange,
}: {
  open: boolean;
  data: ItemType<ID>[];
  selected?: ItemType<ID>;
  onChange: (id: ID) => void;
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
        {data.map((item) => (
          <Item
            key={item.id}
            active={item === selected}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </Item>
        ))}
      </Style>
    ) : null,
  );
}

export default SelectList;
