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
import SessionStorageKey from '@/constants/session_storage_key';
import absoluteFullSize from '@/style/absolute_full_size';
import useQuery from '@/utils/use_query';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Musicbill as MusicbillType } from '../../constants';
import Page from '../page';
import Info from './info';
import MusicList from './music_list';
import { INFO_HEIGHT, MINI_INFO_HEIGHT } from './constants';
import MiniInfo from './mini_info';
import Filter from './filter';

const Style = styled(Page)`
  ${absoluteFullSize}

  > .scrollable {
    height: 100%;

    overflow: auto;
  }
`;

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  const { id, status, musicList } = musicbill;
  const { keyword = '' } = useQuery<Query.KEYWORD>();

  const scrollableRef = useRef<HTMLDivElement>(null);
  const [miniInfoVisible, setMiniInfoVisible] = useState(false);

  const saveScrollTop = useMemo(
    () =>
      throttle(
        (scrollTop: number) =>
          window.sessionStorage.setItem(
            SessionStorageKey.MUSICBILL_PAGE_SCROLL_TOP.replace('{{id}}', id),
            scrollTop.toString(),
          ),
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
    if (status === RequestStatus.NOT_START) {
      playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL_DETAIL, {
        id,
      });
    }
  }, [id, status]);

  useLayoutEffect(() => {
    if (status === RequestStatus.SUCCESS) {
      let scrollTop = 0;
      if (!keyword) {
        const lastScrollTopString = window.sessionStorage.getItem(
          SessionStorageKey.MUSICBILL_PAGE_SCROLL_TOP.replace('{{id}}', id),
        );
        if (lastScrollTopString) {
          scrollTop = Number(lastScrollTopString) || 0;
        }
      }
      window.setTimeout(
        () =>
          scrollableRef.current?.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
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
