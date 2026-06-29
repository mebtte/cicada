import Avatar from '@/components/avatar';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import { ArtistDetail } from '../constants';
import e, { EventType } from '../../../eventemitter';

const AVATAR_SIZE = 32;
const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  min-height: 56px;
  padding: 8px 12px 12px;

  transition:
    transform 120ms ease-out,
    box-shadow 120ms ease-out,
    filter 120ms ease-out;
  cursor: pointer;
  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 14px;
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};

  > .name {
    flex: 1;
    min-width: 0;

    ${ellipsis}
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 800;
    color: rgb(75 75 75);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
  }
`;

function Performer({ performer }: { performer: ArtistDetail }) {
  return (
    <Style
      onClick={() => e.emit(EventType.OPEN_ARTIST_DRAWER, { id: performer.id })}
    >
      <Avatar
        size={AVATAR_SIZE}
        src={getResizedImage({ url: performer.avatar, size: AVATAR_SIZE * 2 })}
      />
      <div className="name">{performer.name}</div>
    </Style>
  );
}

export default Performer;
