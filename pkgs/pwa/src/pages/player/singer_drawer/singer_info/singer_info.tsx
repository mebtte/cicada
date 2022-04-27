import React from 'react';

import Avatar from '@/components/avatar';
import { Singer } from '../constants';
import { COVER_SIZE, Container } from './constants';

const SingerInfo = ({ singer }: { singer: Singer }) => (
  <Container>
    <div className="info">
      <div className="name">{singer.name}</div>
      {singer.alias ? <div className="alias">{singer.alias}</div> : null}
    </div>
    <Avatar animated src={singer.avatar} size={COVER_SIZE} />
  </Container>
);

export default SingerInfo;
