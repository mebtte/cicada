import styled from 'styled-components';
import { SortableElement } from 'react-sortable-hoc';
import { CSSVariable } from '@/global_style';
import { useEffect, useState } from 'react';
import classnames from 'classnames';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import MusicbillCover from '../components/musicbill_cover';
import { LocalMusicbill } from './constant';
import { ZIndex } from '../constants';
import e, { EventType } from './eventemitter';

const COVER_SIZE = 28;
const Style = styled.div`
  z-index: ${ZIndex.DRAWER + 1};

  padding: 8px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  cursor: grab;
  background-color: #fff;
  user-select: none;

  > .name {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  &.active {
    background-color: ${CSSVariable.COLOR_PRIMARY};

    > .name {
      color: #fff;
    }
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
    <Style className={classnames({ active })}>
      <MusicbillCover
        size={COVER_SIZE}
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        publiz={musicbill.public}
        shared={musicbill.shared}
      />
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

export default SortableElement<Props>(Musicbill);
