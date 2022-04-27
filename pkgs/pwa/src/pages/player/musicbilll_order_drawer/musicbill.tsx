import React, { useRef } from 'react';
import styled from 'styled-components';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { XYCoord } from 'dnd-core';

import ellipsis from '@/style/ellipsis';
import Avatar from '@/components/avatar';
import { Musicbill as MusicbillType } from './constant';

const Style = styled.div`
  padding: 5px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  cursor: move;
  > .name {
    flex: 1;

    ${ellipsis}
    font-size: 14px;
    color: rgb(55 55 55);
  }
`;

const TYPE = 'musicbill';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const Musicbill = ({
  index,
  musicbill,
  move,
}: {
  index: number;
  musicbill: MusicbillType;
  move: (dragIndex: number, hoverIndex: number) => void;
}) => {
  const { id, name, cover } = musicbill;
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: TYPE,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      move(dragIndex, hoverIndex);
      // eslint-disable-next-line no-param-reassign
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    item: { type: TYPE, id, index },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));
  return (
    <Style
      ref={ref}
      style={{
        opacity: isDragging ? 0 : 1,
      }}
    >
      <Avatar src={cover} size={24} />
      <div className="name">{name}</div>
    </Style>
  );
};

export default Musicbill;
