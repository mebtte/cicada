import {
  UIEventHandler,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { RequestStatus } from '@/constants';
import { throttle } from 'lodash-es';
import autoScrollbar from '@/style/auto_scrollbar';
import cache, { CacheKey } from './cache';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Musicbill as MusicbillType } from '../../constants';
import Page from '../page';
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
    padding: 20px;
    background:
      linear-gradient(180deg, rgb(247 253 248) 0, rgb(248 249 250) 300px),
      rgb(248 249 250);
    ${autoScrollbar}
  }

  @media (max-width: 680px) {
    > .scrollable {
      padding: 12px;
    }
  }
`;

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  const { id, status, lastUpdateTimestamp } = musicbill;

  const scrollableRef = useRef<HTMLDivElement>(null);
  const [miniInfoVisible, setMiniInfoVisible] = useState(false);

  const saveScrollTop = useMemo(
    () =>
      throttle(
        (scrollTop: number) =>
          cache.set({
            key: CacheKey.MUSICBILL_PAGE_SCROLL_TOP,
            value: scrollTop,
            keyReplace: (k) => k.replace('{{id}}', id),
          }),
        1000,
      ),
    [id],
  );

  const onScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    setMiniInfoVisible(scrollTop >= INFO_HEIGHT - MINI_INFO_HEIGHT);
    saveScrollTop(scrollTop);
  };

  useEffect(() => {
    if (Date.now() - lastUpdateTimestamp > RELOAD_INTERVAL) {
      playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
        id,
        silence: true,
      });
    }
  }, [id, lastUpdateTimestamp]);

  useLayoutEffect(() => {
    if (status === RequestStatus.SUCCESS) {
      const scrollTop =
        cache.get(CacheKey.MUSICBILL_PAGE_SCROLL_TOP, (k) =>
          k.replace('{{id}}', id),
        ) || 0;
      window.setTimeout(
        () =>
          scrollableRef.current?.scrollTo({
            top: scrollTop,
          }),
        0,
      );
    }
  }, [id, status]);

  return (
    <Style>
      <div className="scrollable" ref={scrollableRef} onScroll={onScroll}>
        <Info musicbill={musicbill} />
        <MusicList musicbill={musicbill} />
      </div>

      {miniInfoVisible ? <MiniInfo musicbill={musicbill} /> : null}
    </Style>
  );
}

export default Musicbill;
