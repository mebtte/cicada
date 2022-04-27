import React, { useMemo } from 'react';
import styled from 'styled-components';

import Tooltip from '@/components/tooltip';
import IconButton, { Name } from '@/components/icon_button';
import { Music as BaseMusic } from '../constants';
import { Music } from './constants';
import useMusicOperate from '../use_music_operate';

const ACTION_SIZE = 24;
const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Action = ({ music, onClose }: { music: Music; onClose: () => void }) => {
  const baseMusic = useMemo<BaseMusic>(
    () => ({
      ...music,
      fork: music.fork.map((m) => m.id),
      forkFrom: music.forkFrom.map((m) => m.id),
    }),
    [music],
  );
  const { onPlay, onAddToPlayqueue, onAddToMusicbill, onWatchMv, onOperate } =
    useMusicOperate(baseMusic);
  return (
    <Style>
      <IconButton
        name={Name.PLAY_OUTLINE}
        onClick={onPlay}
        size={ACTION_SIZE}
      />
      <Tooltip title="下一首播放">
        <IconButton
          name={Name.INSERT_OUTLINE}
          onClick={onAddToPlayqueue}
          size={ACTION_SIZE}
        />
      </Tooltip>
      <Tooltip title="添加到歌单">
        <IconButton
          name={Name.ADD_TO_OUTLINE}
          onClick={onAddToMusicbill}
          size={ACTION_SIZE}
        />
      </Tooltip>
      {music.mvLink ? (
        <Tooltip title="观看MV">
          <IconButton
            name={Name.VIDEO_OUTLINE}
            onClick={() => {
              onWatchMv();
              onClose();
            }}
            size={ACTION_SIZE}
          />
        </Tooltip>
      ) : null}
      <IconButton
        name={Name.MORE_OUTLINE}
        onClick={onOperate}
        size={ACTION_SIZE}
      />
    </Style>
  );
};

export default Action;
