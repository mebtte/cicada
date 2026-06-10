import { HTMLAttributes } from 'react';
import styled from 'styled-components';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import Singer, { type SingerValue } from '../singer';

export interface MusicInfoProps extends HTMLAttributes<HTMLDivElement> {
  musicCover: string;
  musicCoverThumbnail?: string;
  musicId: string;
  musicName: string;
  onOpenMusic?: (id: string) => void;
  onOpenSinger?: (singer: SingerValue) => void;
  singers: SingerValue[];
}

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
  musicCover,
  musicCoverThumbnail,
  musicId,
  musicName,
  onOpenMusic,
  onOpenSinger,
  singers,
  ...props
}: MusicInfoProps) {
  return (
    <Style {...props} onClick={() => onOpenMusic?.(musicId)}>
      <Cover src={musicCover} placeholderSrc={musicCoverThumbnail} size={40} />
      <div className="info">
        <div className="name">{musicName}</div>
        <div className="singers ">
          {singers.map((singer) => (
            <Singer key={singer.id} singer={singer} onOpen={onOpenSinger} />
          ))}
        </div>
      </div>
    </Style>
  );
}

export default MusicInfo;
