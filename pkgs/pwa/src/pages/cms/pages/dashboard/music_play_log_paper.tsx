import React from 'react';

import { Name } from '@/components/icon';
import Paper from './paper';

const MusicPlayLogPaper = ({ total }: { total: number }) => (
  <Paper label="音乐播放次数" icon={Name.MUSIC_FILL} value={total.toString()} />
);

export default MusicPlayLogPaper;
