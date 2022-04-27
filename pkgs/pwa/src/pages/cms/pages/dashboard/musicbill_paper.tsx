import React from 'react';

import { Name } from '@/components/icon';
import Paper from './paper';

const MusicbillPaper = ({ total }: { total: number }) => (
  <Paper
    label="歌单数"
    icon={Name.ORDERED_LIST_OUTLINE}
    value={total.toString()}
  />
);

export default MusicbillPaper;
