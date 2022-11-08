import { CSSProperties, HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';
import ellipsis from '#/style/ellipsis';
import Cover from '#/components/cover';
import eventemitter, { EventType } from '../eventemitter';
import Singer from './singer';
import { Music as MusicType } from '../constants';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  > .info {
    flex: 1;
    min-width: 0;

    > .name {
      ${ellipsis}
      font-size: 14px;
      cursor: pointer;
      color: rgb(55 55 55);
      line-height: 1.5;

      &:hover {
        color: rgb(0 0 0);
      }
    }

    > .singers {
      ${ellipsis}
      font-size: 12px;
      color: rgb(155 155 155);
    }
  }
`;
const coverStyle: CSSProperties = {
  cursor: 'pointer',
};

function MusicInfo({
  music,
  ...props
}: {
  music: MusicType;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  const { cover, name, singers } = music;
  return (
    <Style
      {...props}
      onClick={() =>
        eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id })
      }
    >
      <Cover style={coverStyle} src={cover} size={40} />
      <div className="info">
        <div className="name">{name}</div>
        <div className="singers ">
          {singers.map((s) => (
            <Singer key={s.id} singer={s} />
          ))}
        </div>
      </div>
    </Style>
  );
}

export default MusicInfo;
