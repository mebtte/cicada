import { memo, useState } from 'react';
import getRandomCover from '@/utils/get_random_cover';
import Avatar from '@/components/avatar';
import Icon, { Name } from '@/components/icon';
import MusicbillContainer from './musicbill_container';
import { COVER_SIZE, ICON_SIZE, ICON_STYLE } from './constants';
import { openCreateMusicbillDialog } from '../utils';

function CreateMusicbill() {
  const [cover] = useState(getRandomCover());

  return (
    <MusicbillContainer onClick={openCreateMusicbillDialog}>
      <Icon name={Name.PLUS_OUTLINE} size={ICON_SIZE} style={ICON_STYLE} />
      <Avatar src={cover} size={COVER_SIZE} />
      <div className="name">创建乐单</div>
    </MusicbillContainer>
  );
}

export default memo(CreateMusicbill);
