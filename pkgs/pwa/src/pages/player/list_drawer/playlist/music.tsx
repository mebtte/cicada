import React, { useCallback } from 'react';
import styled from 'styled-components';

import ellipsis from '@/style/ellipsis';
import IconButton, { Name, Type } from '@/components/icon_button';
import useMusicOperate from '../../use_music_operate';
import eventemitter, { EventType } from '../../eventemitter';
import Singer from '../../components/singer';
import { Figure, MusicWithIndex } from '../../constants';

const HEIGHT = 36;
const ACTION_SIZE = 20;
const Style = styled.div`
  height: ${HEIGHT}px;
  display: flex;
  align-items: center;
  padding-top: 1px;
  border-bottom: 1px solid rgb(0 0 0 / 0.05);
  > .index {
    width: 45px;
    font-size: 12px;
    color: rgb(155 155 155);
  }
  > .info {
    ${ellipsis}
    color: rgb(222 222 222);
    font-size: 12px;
    flex: 1;
    > .name {
      cursor: pointer;
      border: none;
      outline: none;
      background-color: transparent;
      padding: 0;
      margin: 0;
      color: rgb(55 55 55);
      &:hover {
        color: rgb(0 0 0);
      }
    }
    > .singers {
      margin-left: 5px;
    }
  }
  > .actions {
    transition: opacity 300ms;
    opacity: 0;
  }
  &:hover > .actions {
    opacity: 1;
  }
`;

const renderSinger = (s: Figure) => <Singer key={s.id} singer={s} />;

const Music = ({ listMusic }: { listMusic: MusicWithIndex }) => {
  const { onPlay, onView, onOperate, onAddToPlayqueue } = useMusicOperate(
    listMusic.music,
  );
  const onRemove = useCallback(
    () => eventemitter.emit(EventType.ACTION_REMOVE_PLAYLIST_MUSIC, listMusic),
    [listMusic],
  );
  const {
    index,
    music: { name, singers },
  } = listMusic;
  return (
    <Style>
      <div className="index">{index}.</div>
      <div className="info">
        <button type="button" className="name" onClick={onView}>
          {name}
        </button>
        <span className="singers">
          {singers.length ? singers.map(renderSinger) : <Singer />}
        </span>
      </div>
      <div className="actions">
        <IconButton
          name={Name.MORE_OUTLINE}
          size={ACTION_SIZE}
          onClick={onOperate}
        />
        <IconButton
          name={Name.PLAY_OUTLINE}
          size={ACTION_SIZE}
          onClick={onPlay}
        />
        <IconButton
          name={Name.INSERT_OUTLINE}
          size={ACTION_SIZE}
          onClick={onAddToPlayqueue}
        />
        <IconButton
          name={Name.WRONG_OUTLINE}
          size={ACTION_SIZE}
          type={Type.DANGER}
          onClick={onRemove}
        />
      </div>
    </Style>
  );
};

export default Music;
