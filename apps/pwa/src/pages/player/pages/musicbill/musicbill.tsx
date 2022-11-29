import {
  UIEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { RequestStatus } from '@/constants';
import throttle from 'lodash/throttle';
import SessionStorageKey from '@/constants/session_storage_key';
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
import Filter from './filter';

const Style = styled(Page)`
  position: relative;

  padding-top: ${HEADER_HEIGHT}px;

  > .scrollable {
    height: 100%;

    overflow: auto;
  }
`;

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  const { id, status, musicList } = musicbill;

  const scrollableRef = useRef<HTMLDivElement>(null);
  const scrollToTop = useCallback(
    () =>
      scrollableRef.current?.scrollTo({
        top: 0,
        behavior: 'smooth',
      }),
    [],
  );
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

  const onScroll: UIEventHandler<HTMLDivElement> = (e) => {
    const { scrollTop } = e.target as HTMLDivElement;
    setMiniInfoVisible(scrollTop >= INFO_HEIGHT);

    return saveScrollTop(scrollTop);
  };

  useEffect(() => {
    if (status === RequestStatus.NOT_START) {
      playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, {
        id,
      });
    }
  }, [id, status]);

  useLayoutEffect(() => {
    if (status === RequestStatus.SUCCESS) {
      const lastScrollTopString = window.sessionStorage.getItem(
        SessionStorageKey.MUSICBILL_PAGE_SCROLL_TOP.replace('{{id}}', id),
      );
      if (lastScrollTopString) {
        scrollableRef.current?.scrollTo({
          top: Number(lastScrollTopString),
        });
      }
    }
  }, [id, status]);

  return (
    <Style>
      <div className="scrollable" ref={scrollableRef} onScroll={onScroll}>
        <Info musicbill={musicbill} />
        <MusicList musicbill={musicbill} />
      </div>

      {miniInfoVisible ? <MiniInfo musicbill={musicbill} /> : null}
      {status === RequestStatus.SUCCESS && musicList.length ? (
        <Filter musicbillId={id} scrollToTop={scrollToTop} />
      ) : null}
      <EditMenu musicbill={musicbill} />
    </Style>
  );
}

export default Musicbill;
