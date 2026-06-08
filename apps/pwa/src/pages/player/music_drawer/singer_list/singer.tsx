import Avatar from '@/components/avatar';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import { SingerDetail } from '../constants';
import e, { EventType } from '../../eventemitter';

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
  border: 2px solid rgb(229 229 229);
  border-radius: 14px;
  box-shadow: 0 4px 0 rgb(229 229 229);

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
    filter: brightness(1.03);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
  }
`;

function Singer({ singer }: { singer: SingerDetail }) {
  return (
    <Style
      onClick={() => e.emit(EventType.OPEN_ARTIST_DRAWER, { id: singer.id })}
    >
      <Avatar
        size={AVATAR_SIZE}
        src={getResizedImage({ url: singer.avatar, size: AVATAR_SIZE * 2 })}
      />
      <div className="name">{singer.name}</div>
    </Style>
  );
}

export default Singer;
