import { UIEventHandler, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { RequestStatus } from '@/constants';
import throttle from 'lodash/throttle';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { HEADER_HEIGHT, Musicbill as MusicbillType } from '../../constants';
import Page from '../page';
import Info from './info';
import MusicList from './music_list';
import { INFO_HEIGHT } from './constants';
import MiniInfo from './mini_info';
import EditMenu from './edit_menu';

const Style = styled(Page)`
  position: relative;

  padding-top: ${HEADER_HEIGHT}px;

  > .scrollable {
    height: 100%;

    overflow: auto;
  }
`;

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  const [miniInfoVisible, setMiniInfoVisible] = useState(false);

  const onScroll: UIEventHandler<HTMLDivElement> = useMemo(
    () =>
      throttle((e) => {
        const { scrollTop } = e.target as HTMLDivElement;
        return setMiniInfoVisible(scrollTop >= INFO_HEIGHT);
      }),
    [],
  );

  useEffect(() => {
    if (musicbill.status === RequestStatus.NOT_START) {
      playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
        id: musicbill.id,
      });
    }
  }, [musicbill]);

  return (
    <Style>
      <div className="scrollable" onScroll={onScroll}>
        <Info musicbill={musicbill} />
        <MusicList musicbill={musicbill} />
      </div>

      {miniInfoVisible ? <MiniInfo musicbill={musicbill} /> : null}
      <EditMenu musicbill={musicbill} />
    </Style>
  );
}

export default Musicbill;
