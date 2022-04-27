import React from 'react';

import Container from './container';
import Singer from '../../components/singer';
import MusicTagList from '../../components/music_tag_list';
import { Music as MusicType } from '../../constants';
import eventemitter, { EventType } from '../../eventemitter';

const MusicInfo = ({
  music,
  ...props
}: {
  music: MusicType;
  [key: string]: any;
}) => {
  const onView = () => eventemitter.emit(EventType.OPEN_MUSIC_DRAWER, music);
  const { name, singers } = music;
  return (
    <Container {...props}>
      <div className="text">
        <span className="name" onClick={onView}>
          {name}
        </span>
        <span className="singers">
          {singers.length ? (
            singers.map((s) => <Singer key={s.id} singer={s} />)
          ) : (
            <Singer />
          )}
        </span>
      </div>
      <MusicTagList music={music} />
    </Container>
  );
};

export default MusicInfo;
