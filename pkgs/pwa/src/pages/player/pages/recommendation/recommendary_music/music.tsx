import React from 'react';

import IconButton, { Name } from '@/components/icon_button';
import useMusicOperate from '../../../use_music_operate';
import { Music as MusicType } from '../../../constants';
import Cover from '../cover';
import Style from './music_style';
import Singer from '../../../components/singer';
import { ACTION_SIZE } from '../constants';

const Music = ({ music }: { music: MusicType }) => {
  const { onView, onPlay, onAddToPlayqueue, onAddToMusicbill, onOperate } =
    useMusicOperate(music);

  const { name, singers } = music;
  return (
    <Style>
      <div className="cover-box">
        <Cover src={music.cover} onClick={onView} />
        <div className="menu">
          <IconButton
            name={Name.PLAY_OUTLINE}
            onClick={onPlay}
            size={ACTION_SIZE}
          />
          <IconButton
            name={Name.INSERT_OUTLINE}
            onClick={onAddToPlayqueue}
            size={ACTION_SIZE}
          />
          <IconButton
            name={Name.ADD_TO_OUTLINE}
            onClick={onAddToMusicbill}
            size={ACTION_SIZE}
          />
          <IconButton
            name={Name.MORE_OUTLINE}
            onClick={onOperate}
            size={ACTION_SIZE}
          />
        </div>
      </div>
      <div className="name" onClick={onView}>
        {name}
      </div>
      <div className="singers">
        {singers.length ? (
          singers.map((s) => <Singer key={s.id} singer={s} />)
        ) : (
          <Singer />
        )}
      </div>
    </Style>
  );
};

export default Music;
