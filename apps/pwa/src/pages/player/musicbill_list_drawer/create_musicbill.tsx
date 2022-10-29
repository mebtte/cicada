import { memo, useState } from 'react';
import getRandomCover from '@/utils/get_random_cover';
import Avatar from '@/components/avatar';
import Icon, { Name } from '@/components/icon';
import MusicbillContainer from './musicbill_container';
import { COVER_SIZE, ICON_SIZE, ICON_STYLE } from './constants';
import eventemitter, { EditDialogType, EventType } from '../eventemitter';
import { createMusicbill } from '../utils';

const onCreateMusicbill = () =>
  eventemitter.emit(EventType.OPEN_EDIT_DIALOG, {
    type: EditDialogType.INPUT,
    title: '创建乐单',
    onSubmit: createMusicbill,
    label: '名字',
  });

function CreateMusicbill() {
  const [cover] = useState(getRandomCover());

  return (
    <MusicbillContainer onClick={onCreateMusicbill}>
      <Icon name={Name.PLUS_OUTLINE} size={ICON_SIZE} style={ICON_STYLE} />
      <Avatar src={cover} size={COVER_SIZE} />
      <div className="name">创建乐单</div>
    </MusicbillContainer>
  );
}

export default memo(CreateMusicbill);
