import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import eventemitter, { EventType } from '../eventemitter';
import Singer from './singer';

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;

  cursor: pointer;
  user-select: none;

  > .info {
    flex: 1;
    min-width: 0;

    > .name {
      ${ellipsis}
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      color: rgb(55 55 55);
      line-height: 1.5;
    }

    > .singers {
      ${ellipsis}
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
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
  musicId,
  musicCover,
  musicName,
  singers,
  ...props
}: {
  musicId: string;
  musicCover: string;
  musicName: string;
  singers: { id: string; name: string }[];
} & HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <Style
      {...props}
      onClick={() =>
        eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, { id: musicId })
      }
    >
      <Cover src={musicCover} size={40} />
      <div className="info">
        <div className="name">{musicName}</div>
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
