import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from '@/components/icon';
import { CSS_VAR } from '@/components/theme';
import Cover from '@/components/cover';
import { LocalMusicbill } from './constant';

const COVER_SIZE = 42;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const PUBLIC = '#63d1fa';
const PUBLIC_SHADOW = 'rgb(72 179 220)';
const NEUTRAL_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const Style = styled.div<{ $dragging: boolean }>`
  position: relative;
  z-index: ${({ $dragging }) => ($dragging ? 2 : 1)};

  min-height: 70px;
  padding: 0 10px 4px 12px;

  display: flex;
  align-items: center;
  gap: 12px;

  cursor: grab;
  user-select: none;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;

  font-family: ${FONT};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  background: ${({ $dragging }) => ($dragging ? 'rgb(232 255 218)' : '#fff')};
  border: 2px solid ${({ $dragging }) =>
    $dragging ? PRIMARY : CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 4px 0 ${({ $dragging }) =>
    $dragging ? PRIMARY_SHADOW : NEUTRAL_SHADOW};
  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms ease-out,
    background 150ms ease-out;

  > .name {
    flex: 1;
    min-width: 0;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 900;
    letter-spacing: 0;
    line-height: 1.35;
    color: ${({ $dragging }) =>
      $dragging ? 'rgb(58 122 0)' : CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .handle {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: ${({ $dragging }) =>
      $dragging ? PRIMARY : CSSVariable.TEXT_COLOR_SECONDARY};
    background: #fff;
    border: 2px solid ${({ $dragging }) =>
      $dragging ? PRIMARY : CSSVariable.COLOR_BORDER};
    border-radius: 10px;
    box-shadow: 0 3px 0 ${({ $dragging }) =>
      $dragging ? PRIMARY_SHADOW : NEUTRAL_SHADOW};
    font-size: 20px;
  }

  &:hover {
    border-color: ${({ $dragging }) => ($dragging ? PRIMARY : 'rgb(198 198 198)')};
    filter: brightness(1.02);
  }

  &:active {
    cursor: grabbing;
  }
`;
const CoverArt = styled(Cover)<{ $dragging: boolean; $public: boolean }>`
  flex: 0 0 auto;
  overflow: hidden;

  background: #fff;
  border: 2px solid
    ${({ $dragging, $public }) =>
      $dragging ? PRIMARY : $public ? PUBLIC : CSSVariable.COLOR_BORDER};
  border-radius: 12px;
  box-shadow: 0 4px 0
    ${({ $dragging, $public }) =>
      $dragging ? PRIMARY_SHADOW : $public ? PUBLIC_SHADOW : NEUTRAL_SHADOW};
`;

function Musicbill({ musicbill }: { musicbill: LocalMusicbill }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: musicbill.id });

  return (
    <Style
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      $dragging={isDragging}
      {...attributes}
      {...listeners}
    >
      <CoverArt
        $dragging={isDragging}
        $public={musicbill.public}
        size={COVER_SIZE}
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
      />
      <div className="name">{musicbill.name}</div>
      <div className="handle">
        <DragIndicator aria-hidden="true" />
      </div>
    </Style>
  );
}

export default Musicbill;
