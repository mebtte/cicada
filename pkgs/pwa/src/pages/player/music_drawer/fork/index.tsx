import React from 'react';

import { Music } from '../constants';
import MusicList from './music_list';

const Fork = ({ music }: { music: Music }) => {
  const { fork, forkFrom } = music;
  return (
    <>
      {fork.length ? (
        <MusicList label="被以下音乐二次创作" musicList={fork} />
      ) : null}
      {forkFrom.length ? (
        <MusicList label="二次创作自以下音乐" musicList={forkFrom} />
      ) : null}
    </>
  );
};

export default Fork;
