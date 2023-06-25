import {
  UIEventHandler,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { Query, RequestStatus } from '@/constants';
import throttle from 'lodash/throttle';
import useQuery from '@/utils/use_query';
import cache, { CacheKey } from './cache';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { HEADER_HEIGHT, Musicbill as MusicbillType } from '../../constants';
import Page from '../page';
import Info from './info';
import MusicList from './music_list';
import { INFO_HEIGHT, MINI_INFO_HEIGHT } from './constants';
import MiniInfo from './mini_info';
import Filter from './filter';

const RELOAD_INTERVAL = 1000 * 60 * 15;
const Style = styled(Page)`
  position: absolute;
  top: ${HEADER_HEIGHT}px;
  left: 0;
  width: 100%;
  height: calc(100% - ${HEADER_HEIGHT}px);

  > .scrollable {
    height: 100%;

    overflow: auto;
  }
`;

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  const { id, status, musicList, lastUpdateTimestamp } = musicbill;
  const { keyword = '' } = useQuery<Query.KEYWORD>();

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

    if (!keyword) {
      saveScrollTop(scrollTop);
    }
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
      let scrollTop = 0;
      if (!keyword) {
        scrollTop =
          cache.get(CacheKey.MUSICBILL_PAGE_SCROLL_TOP, (k) =>
            k.replace('{{id}}', id),
          ) || 0;
      }
      window.setTimeout(
        () =>
          scrollableRef.current?.scrollTo({
            top: scrollTop,
          }),
        0,
      );
    }
  }, [id, status, keyword]);

  return (
    <Style>
      <div className="scrollable" ref={scrollableRef} onScroll={onScroll}>
        <Info musicbill={musicbill} />
        <MusicList keyword={keyword} musicbill={musicbill} />
      </div>

      {miniInfoVisible ? <MiniInfo musicbill={musicbill} /> : null}
      {status === RequestStatus.SUCCESS && musicList.length ? <Filter /> : null}
    </Style>
  );
}

export default Musicbill;
