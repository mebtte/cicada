import React, { useCallback } from 'react';
import styled, { css } from 'styled-components';

import ellipsis from '@/style/ellipsis';
import IconButton, { Name, Type } from '@/components/icon_button';
import useMusicOperate from '../../use_music_operate';
import eventemitter, { EventType } from '../../eventemitter';
import Singer from '../../components/singer';
import { Figure, QueueMusic } from '../../constants';

const HEIGHT = 36;
const ACTION_SIZE = 20;
const Style = styled.div<{ active: boolean }>`
  height: ${HEIGHT}px;
  display: flex;
  align-items: center;
  padding-top: 1px;
  border-width: 0 0 1px 0;
  border-style: solid;
  > .index {
    display: inline-block;
    width: 45px;
    font-size: 12px;
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
    opacity: 0;
    transition: transform 0.3s;
  }
  &:hover > .actions {
    opacity: 1;
  }
  ${({ active }) => css`
    border-color: ${active ? 'rgb(49 194 124)' : 'rgb(0 0 0 / 0.05)'};
    > .index {
      color: ${active ? 'rgb(49 194 124)' : 'rgb(155 155 155)'};
    }
  `}
`;

const renderSinger = (s: Figure) => <Singer key={s.id} singer={s} />;

const Music = ({
  activeIndex,
  queueMusic,
  playqueueLength,
}: {
  activeIndex: number;
  playqueueLength: number;
  queueMusic: QueueMusic;
}) => {
  const { index } = queueMusic;
  const { onView, onOperate } = useMusicOperate(queueMusic.music);
  const onJump = useCallback(() => {
    if (index === activeIndex) {
      return;
    }
    return eventemitter.emit(EventType.ACTION_PLAY_PLAYQUEUE_INDEX, index - 1);
  }, [index, activeIndex]);
  const onRemove = useCallback(
    () =>
      eventemitter.emit(EventType.ACTION_REMOVE_PLAYQUEUE_MUSIC, queueMusic),
    [queueMusic],
  );
  const onMoveLater = useCallback(
    () =>
      eventemitter.emit(
        EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_LATER,
        queueMusic,
      ),
    [queueMusic],
  );
  const onMoveEarly = useCallback(
    () =>
      eventemitter.emit(
        EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_EARLY,
        queueMusic,
      ),
    [queueMusic],
  );

  const { name, singers } = queueMusic.music;
  const active = index === activeIndex;
  return (
    <Style active={active}>
      <span className="index">{index}.</span>
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
        {index > activeIndex && (
          <IconButton
            name={Name.WRONG_OUTLINE}
            size={ACTION_SIZE}
            type={Type.DANGER}
            onClick={onRemove}
          />
        )}
        {index < playqueueLength && index > activeIndex && (
          <IconButton
            name={Name.UP_OUTLINE}
            size={ACTION_SIZE}
            onClick={onMoveLater}
          />
        )}
        {index > activeIndex + 1 && (
          <IconButton
            name={Name.DOWN_OUTLINE}
            size={ACTION_SIZE}
            onClick={onMoveEarly}
          />
        )}
        {active ? null : (
          <IconButton
            name={Name.JUMP_FILL}
            size={ACTION_SIZE}
            onClick={onJump}
          />
        )}
      </div>
    </Style>
  );
};

export default Music;
