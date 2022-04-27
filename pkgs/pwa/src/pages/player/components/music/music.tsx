import React from 'react';

import IconButton, { Name } from '@/components/icon_button';
import { MusicWithIndex, Figure } from '../../constants';
import useMusicOperate from '../../use_music_operate';
import Container from './container';
import Singer from '../singer';
import MusicTagList from '../music_tag_list';

const ACTION_SIZE = 22;
const renderSinger = (s: Figure) => <Singer key={s.id} singer={s} />;

const Music = ({
  musicWithIndex,
  style,
}: {
  musicWithIndex: MusicWithIndex;
  style?: React.CSSProperties;
}) => {
  const { index, music } = musicWithIndex;
  const { onPlay, onAddToMusicbill, onAddToPlayqueue, onOperate, onView } =
    useMusicOperate(music);
  const { name, alias, singers } = music;
  return (
    <Container style={style}>
      <div className="index">{index}</div>
      <div className="info">
        <div className="top">
          <div className="text">
            <span className="name" onClick={onView}>
              {name}
            </span>
            {alias ? <span className="alias">{alias}</span> : null}
          </div>
          <MusicTagList music={music} />
        </div>
        <div className="singers">
          {singers.length ? singers.map(renderSinger) : <Singer />}
        </div>
      </div>
      <div className="actions">
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
          name={Name.ADD_TO_OUTLINE}
          size={ACTION_SIZE}
          onClick={onAddToMusicbill}
        />
        <IconButton
          name={Name.MORE_OUTLINE}
          size={ACTION_SIZE}
          onClick={onOperate}
        />
      </div>
    </Container>
  );
};

export default Music;
