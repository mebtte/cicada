import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import classnames from 'classnames';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MusicbillCover from '../components/musicbill_cover';
import { LocalMusicbill } from './constant';
import { ZIndex } from '../constants';

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

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
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

function Musicbill({ musicbill }: { musicbill: LocalMusicbill }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: musicbill.id });

  return (
    <Style
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={classnames({ active: isDragging })}
      {...attributes}
      {...listeners}
    >
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

export default Musicbill;
