import React, { useEffect } from 'react';
import styled from 'styled-components';

import { RequestStatus } from '@/constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Action from './action';
import EditDialog from './edit_dialog';
import CoverEditDialog from './cover_edit_dialog';
import { Musicbill as MusicbillType } from '../../constants';
import TopContent from './top_content';
import MusicList from './music_list';

const Style = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  > .content {
    flex: 1;
    min-width: 0;
    display: flex;
  }
`;

const Musicbill = ({ musicbill }: { musicbill: MusicbillType }) => {
  useEffect(() => {
    if (musicbill.status === RequestStatus.NOT_START) {
      playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
        id: musicbill.id,
      });
    }
  }, [musicbill]);

  return (
    <Style>
      <TopContent musicbill={musicbill} />
      <div className="content">
        <MusicList musicbill={musicbill} />
        <Action musicbill={musicbill} />
      </div>
      <EditDialog musicbill={musicbill} />
      <CoverEditDialog musicbill={musicbill} />
    </Style>
  );
};

export default Musicbill;
