import React from 'react';

import { Music as MusicType } from '../../../constants';
import Music from './music';

const MusicList = ({ musicList }: { musicList: MusicType[] }) => (
  <>
    {musicList.map((m) => (
      <Music key={m.id} music={m} />
    ))}
  </>
);

export default React.memo(MusicList);
