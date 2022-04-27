import React, { useCallback } from 'react';
import styled from 'styled-components';

import ellipsis from '@/style/ellipsis';
import Avatar from '@/components/avatar';
import eventemitter, { EventType } from '../eventemitter';
import Singer from './singer';
import MusicTagList from './music_tag_list';
import { Music as MusicType } from '../constants';

const Style = styled.div`
  display: flex;
  align-items: center;
  > .info {
    margin-left: 10px;
    flex: 1;
    min-width: 0;
    > .top {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 3px;
      > .name {
        ${ellipsis}
        font-size: 14px;
        cursor: pointer;
        color: rgb(55 55 55);
        &:hover {
          color: rgb(0 0 0);
        }
      }
    }
    > .singers {
      ${ellipsis}
      font-size: 12px;
      color: rgb(155 155 155);
    }
  }
`;
const COVER_SIZE = 40;
const COVER_STYLE = {
  cursor: 'pointer',
};

const MusicInfo = ({
  music,
  ...props
}: {
  music: MusicType;
  [key: string]: any;
}) => {
  const onViewMusic = useCallback(
    () => eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, music),
    [music],
  );
  const { cover, name, singers } = music;
  return (
    <Style {...props}>
      <Avatar
        style={COVER_STYLE}
        animated
        src={cover}
        size={COVER_SIZE}
        onClick={onViewMusic}
      />
      <div className="info">
        <div className="top">
          <div className="name" onClick={onViewMusic}>
            {name}
          </div>
          <MusicTagList music={music} />
        </div>
        <div className="singers ">
          {singers.length ? (
            singers.map((s) => <Singer key={s.id} singer={s} />)
          ) : (
            <Singer />
          )}
        </div>
      </div>
    </Style>
  );
};

export default MusicInfo;
