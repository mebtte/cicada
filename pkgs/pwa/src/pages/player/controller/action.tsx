import React, { useContext } from 'react';
import styled from 'styled-components';

import Tooltip from '@/components/tooltip';
import IconButton, { Name as IconButtonName } from '@/components/icon_button';
import useAudioControl from '../use_audio_control';
import eventemitter, { EventType } from '../eventemitter';
import Context from '../context';
import { Music } from '../constants';

const ACTION_SPACE = 15;
const ACTION_SIZE = 24;
const Style = styled.div`
  font-size: 0;
  display: flex;
  align-items: center;
  > .line {
    width: 1px;
    height: 15px;
    margin-left: ${ACTION_SPACE}px;
    background-color: var(--text-color-secondary);
  }
  > .action {
    margin-left: ${ACTION_SPACE}px;
  }
`;
const onOpenList = () =>
  eventemitter.emit(EventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER);

const Action = ({ music }: { music: Music | null }) => {
  const { audioLoading, audioPaused } = useContext(Context);
  const { onTogglePlay, onPrevious, onNext } = useAudioControl(audioLoading);

  const onAddToPlayqueue = () =>
    music
      ? eventemitter.emit(EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE, music)
      : null;
  const onAddToMusicbill = () =>
    music
      ? eventemitter.emit(EventType.OPEN_MUSICBILL_LIST_DRAWER, music)
      : null;
  const onOperate = () =>
    music ? eventemitter.emit(EventType.OPEN_MUSIC_OPERATE_POPUP, music) : null;
  return (
    <Style>
      <IconButton
        className="action"
        name={IconButtonName.INSERT_OUTLINE}
        size={ACTION_SIZE}
        onClick={onAddToPlayqueue}
      />
      <IconButton
        className="action"
        name={IconButtonName.ADD_TO_OUTLINE}
        size={ACTION_SIZE}
        onClick={onAddToMusicbill}
      />
      <IconButton
        className="action"
        name={IconButtonName.MORE_OUTLINE}
        size={ACTION_SIZE}
        onClick={onOperate}
      />
      <div className="line" />
      <Tooltip title="播放列表 | 播放队列">
        <IconButton
          className="action"
          name={IconButtonName.LIST_OUTLINE}
          size={ACTION_SIZE}
          onClick={onOpenList}
        />
      </Tooltip>
      <div className="line" />
      <IconButton
        className="action"
        name={IconButtonName.PREVIOUS_FILL}
        size={ACTION_SIZE}
        onClick={onPrevious}
      />
      <IconButton
        className="action"
        name={
          audioPaused ? IconButtonName.PLAY_FILL : IconButtonName.PAUSE_FILL
        }
        size={ACTION_SIZE * 1.3}
        onClick={onTogglePlay}
        loading={audioLoading}
      />
      <IconButton
        className="action"
        name={IconButtonName.NEXT_FILL}
        size={ACTION_SIZE}
        onClick={onNext}
      />
    </Style>
  );
};

export default Action;
