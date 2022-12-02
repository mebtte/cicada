import styled from 'styled-components';
import { SortableElement } from 'react-sortable-hoc';
import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import { useEffect, useState } from 'react';
import { MdDragHandle } from 'react-icons/md';
import { LocalMusicbill } from './constant';
import { ZIndex } from '../constants';
import e, { EventType } from './eventemitter';

const Style = styled.div`
  z-index: ${ZIndex.DRAWER + 1};

  padding: 8px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  cursor: grab;
  background-color: #fff;

  > .cover {
    width: 28px;
    height: 28px;

    object-fit: cover;
    object-position: center;
  }

  > .name {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .handle {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }
`;
type Props = { selfIndex: number; musicbill: LocalMusicbill };

function Musicbill({ selfIndex, musicbill }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const unlistenBeforeDragStart = e.listen(
      EventType.BEFORE_DRAG_START,
      (data) => setActive(data.index === selfIndex),
    );
    const unlistenDragEnd = e.listen(EventType.DRAG_END, () =>
      setActive(false),
    );
    return () => {
      unlistenBeforeDragStart();
      unlistenDragEnd();
    };
  }, [selfIndex]);

  return (
    <Style
      style={{
        backgroundColor: active
          ? CSSVariable.BACKGROUND_COLOR_LEVEL_THREE
          : 'transparent',
      }}
    >
      <img className="cover" src={musicbill.cover} alt="cover" loading="lazy" />
      <div className="name">{musicbill.name}</div>
      <MdDragHandle className="handle" />
    </Style>
  );
}

export default SortableElement<Props>(Musicbill);
