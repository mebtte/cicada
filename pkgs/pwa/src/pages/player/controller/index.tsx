import React, { useContext } from 'react';
import styled from 'styled-components';

import getRandomCover from '@/utils/get_random_cover';
import Avatar from '@/components/avatar';
import Context from '../context';
import Progress from './progress';
import MusicInfo from './music_info';
import Action from './action';
import { CONTROLLER_HEIGHT } from '../constants';
import eventemitter, { EventType } from '../eventemitter';

const INITIAL_COVER = getRandomCover();
const Style = styled.div`
  z-index: 3;

  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  gap: 20px;

  height: ${CONTROLLER_HEIGHT}px;
  padding: 4px 20px;
  background: rgb(255 255 255 / 0.7);
  transition: 300ms;
  &:hover {
    background: rgb(255 255 255 / 1);
  }
  box-shadow: 0 0 5px rgb(0 0 0 / 0.1);
  > .cover {
    cursor: pointer;
    border: 1px solid var(--color-primary);
  }
  > .right {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    > .right-bottom {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 2px 0 0 0;
      overflow: visible;
    }
  }
`;
const openLyric = () => eventemitter.emit(EventType.TOGGEL_LYRIC);

const Controller = () => {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);
  const queueMusic = playqueue[currentPlayqueuePosition];

  return (
    <Style>
      <div className="right">
        <Progress />
        <div className="right-bottom">
          <MusicInfo music={queueMusic ? queueMusic.music : null} />
          <Action music={queueMusic ? queueMusic.music : null} />
        </div>
      </div>
      <Avatar
        className="cover"
        animated
        size={70}
        src={queueMusic ? queueMusic.music.cover : INITIAL_COVER}
        onClick={openLyric}
      />
    </Style>
  );
};

export default Controller;
