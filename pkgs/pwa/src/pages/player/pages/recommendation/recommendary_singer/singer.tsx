import React from 'react';

import { Figure } from '../../../constants';
import Cover from '../cover';
import Style from './singer_style';
import eventemitter, { EventType } from '../../../eventemitter';

const Singer = ({ singer }: { singer: Figure }) => {
  const { id, name, avatar } = singer;
  const onView = () => eventemitter.emit(EventType.OPEN_SINGER_DRAWER, { id });
  return (
    <Style>
      <Cover src={avatar} onClick={onView} />
      <div className="name" onClick={onView}>
        {name}
      </div>
    </Style>
  );
};

export default Singer;
