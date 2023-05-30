import styled from 'styled-components';
import { SortableElement } from 'react-sortable-hoc';
import { CSSVariable } from '@/global_style';
import { useEffect, useState } from 'react';
import classnames from 'classnames';
import ellipsis from '@/style/ellipsis';
import { MusicbillShareStatus } from '#/constants';
import Cover from '@/components/cover';
import absoluteFullSize from '@/style/absolute_full_size';
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
  user-select: none;

  > .cover-box {
    font-size: 0;
  }

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

  &.public {
    > .cover-box {
      outline: 2px solid #63d1fa;
    }
  }

  &.shared {
    > .cover-box {
      position: relative;

      &::after {
        content: '';

        box-shadow: inset 0 0 0 2px #eabec8;

        ${absoluteFullSize}
      }
    }
  }
`;
type Props = { selfIndex: number; musicbill: LocalMusicbill };
const preventDefault = (event) => event.preventDefault();

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
      className={classnames({
        active,
        public: musicbill.public,
        shared: musicbill.shareStatus !== MusicbillShareStatus.NOT_SHARE,
      })}
    >
      <div className="cover-box">
        <Cover size={28} src={musicbill.cover} onDragStart={preventDefault} />
      </div>
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

export default SortableElement<Props>(Musicbill);
