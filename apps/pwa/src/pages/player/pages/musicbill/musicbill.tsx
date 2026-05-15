import { UIEventHandler, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTransition } from 'react-spring';
import autoScrollbar from '@/style/auto_scrollbar';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Musicbill as MusicbillType } from '../../constants';
import Page, { PAGE_HORIZONTAL_PADDING } from '../page';
import Info from './info';
import MusicList from './music_list';
import { INFO_HEIGHT, MINI_INFO_HEIGHT } from './constants';
import MiniInfo from './mini_info';

const RELOAD_INTERVAL = 1000 * 60 * 15;
const Style = styled(Page)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgb(248 249 250);

  > .scrollable {
    height: 100%;
    overflow: auto;
    padding: ${PAGE_HORIZONTAL_PADDING};
    background:
      linear-gradient(180deg, rgb(247 253 248) 0, rgb(248 249 250) 300px),
      rgb(248 249 250);
    ${autoScrollbar}
  }
`;

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  const { id, lastUpdateTimestamp } = musicbill;

  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const [miniInfoVisible, setMiniInfoVisible] = useState(false);
  const miniInfoTransitions = useTransition(miniInfoVisible, {
    from: {
      opacity: 0,
      transform: 'translate3d(0, -18px, 0) scale(0.98)',
    },
    enter: {
      opacity: 1,
      transform: 'translate3d(0, 0, 0) scale(1)',
    },
    leave: {
      opacity: 0,
      transform: 'translate3d(0, -18px, 0) scale(0.98)',
    },
    config: {
      tension: 360,
      friction: 32,
    },
  });

  const onScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    setMiniInfoVisible(scrollTop >= INFO_HEIGHT - MINI_INFO_HEIGHT);
  };

  useEffect(() => {
    if (Date.now() - lastUpdateTimestamp > RELOAD_INTERVAL) {
      playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
        id,
        silence: true,
      });
    }
  }, [id, lastUpdateTimestamp]);

  return (
    <Style>
      <div className="scrollable" ref={scrollableRef} onScroll={onScroll}>
        <Info musicbill={musicbill} />
        <MusicList musicbill={musicbill} scrollElementRef={scrollableRef} />
      </div>

      {miniInfoTransitions((style, visible) =>
        visible ? <MiniInfo musicbill={musicbill} style={style} /> : null,
      )}
    </Style>
  );
}

export default Musicbill;
