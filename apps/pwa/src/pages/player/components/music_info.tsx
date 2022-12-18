import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import Tag, { Type } from '@/components/tag';
import ellipsis from '@/style/ellipsis';
import eventemitter, { EventType } from '../eventemitter';
import Singer from './singer';
import { Music as MusicType } from '../constants';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;

  cursor: pointer;
  user-select: none;

  > .info {
    flex: 1;
    min-width: 0;

    > .name {
      ${ellipsis}
      font-size: 14px;
      color: rgb(55 55 55);
      line-height: 1.5;
    }

    > .singers {
      ${ellipsis}
      font-size: 12px;
      color: rgb(155 155 155);
    }
  }

  > .tags {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }
`;

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
      <Cover src={cover} size={40} />
      <div className="info">
        <div className="name">{name}</div>
        <div className="singers ">
          {singers.map((s) => (
            <Singer key={s.id} singer={s} />
          ))}
        </div>
      </div>
      <div className="tags">
        {music.hq ? <Tag type={Type.HQ} /> : null}
        {music.ac ? <Tag type={Type.AC} /> : null}
      </div>
    </Style>
  );
}

export default MusicInfo;
