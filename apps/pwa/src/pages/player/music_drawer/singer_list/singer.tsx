import Cover, { Shape } from '#/components/cover';
import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import styled from 'styled-components';
import { Singer as SingerType } from '../../constants';
import e, { EventType } from '../../eventemitter';

const Style = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  max-width: 100%;
  height: 36px;
  padding: 0 10px 0 5px;

  transition: 300ms;
  border-radius: 18px;
  cursor: pointer;
  background-color: rgb(0 0 0 / 0.05);

  > .name {
    flex: 1;
    min-width: 0;

    ${ellipsis}
    font-size: 14px;
    font-weight: bold;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }

  &:hover {
    background-color: rgb(0 0 0 / 0.1);
  }

  &:active {
    background-color: rgb(0 0 0 / 0.15);
  }
`;

function Singer({ singer }: { singer: SingerType }) {
  return (
    <Style
      onClick={() => e.emit(EventType.OPEN_SINGER_DRAWER, { id: singer.id })}
    >
      <Cover
        size={28}
        shape={Shape.CIRCLE}
        src={singer.avatar}
        alt="singer cover"
      />
      <div className="name">{singer.name}</div>
    </Style>
  );
}

export default Singer;
