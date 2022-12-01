import Drawer from '#/components/drawer';
import {
  CSSProperties,
  UIEventHandler,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { flexCenter } from '#/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '#/components/spinner';
import TabList from '#/components/tab_list';
import absoluteFullSize from '#/style/absolute_full_size';
import { EventType } from '../eventemitter';
import useDynamicZIndex from '../use_dynamic_z_index';
import useData from './use_data';
import {
  MINI_INFO_HEIGHT,
  Tab,
  TAB_MAP_LABEL,
  UserDetail as UserDetailType,
} from './constants';
import Info from './info';
import MusicList from './music_list';
import MusicbillList from './musicbill_list';
import MiniInfo from './mini_info';

const TRANSITION = {
  from: { opacity: 0 },
  enter: { opacity: 1 },
  leave: { opacity: 0 },
};
const TAB_LIST: { label: string; tab: Tab }[] = Object.values(Tab).map(
  (tab) => ({
    tab,
    label: TAB_MAP_LABEL[tab],
  }),
);
const bodyProps: { style: CSSProperties } = {
  style: {
    width: '90%',
    maxWidth: 400,
  },
};
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const Style = styled.div`
  ${absoluteFullSize}

  >.scrollable {
    ${absoluteFullSize}

    overflow: auto;

    > .tab-content {
      position: relative;
    }
  }
`;
const StyledTabList = styled(TabList)`
  z-index: 1;

  position: sticky;
  top: ${MINI_INFO_HEIGHT}px;

  padding: 5px 20px;

  backdrop-filter: blur(5px);
  background-color: rgb(255 255 255 / 0.5);
`;
const TabContent = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;

  padding-bottom: env(safe-area-inset-bottom, 0);
`;

function UserDetail({ user }: { user: UserDetailType }) {
  const mountedRef = useRef(false);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(Tab.MUSICBILL);

  const [miniInfoVisible, setMiniInfoVisible] = useState(false);
  const onScroll: UIEventHandler<HTMLDivElement> = (e) => {
    const { clientWidth, scrollTop } = e.target as HTMLDivElement;
    return setMiniInfoVisible(scrollTop >= clientWidth - MINI_INFO_HEIGHT);
  };

  useLayoutEffect(() => {
    if (mountedRef.current) {
      scrollableRef.current!.scrollTo({
        top: scrollableRef.current!.clientWidth - MINI_INFO_HEIGHT,
        behavior: 'smooth',
      });
    }
    mountedRef.current = true;
  }, [tab]);

  const transitions = useTransition(tab, TRANSITION);
  return (
    <Style>
      <div className="scrollable" onScroll={onScroll} ref={scrollableRef}>
        <Info user={user} />
        <StyledTabList
          current={tab}
          tabList={TAB_LIST}
          onChange={(t) => setTab(t)}
        />
        <div className="tab-content">
          {transitions((style, t) => {
            switch (t) {
              case Tab.MUSIC: {
                return (
                  <TabContent style={style}>
                    <MusicList musicList={user.musicList} />
                  </TabContent>
                );
              }

              case Tab.MUSICBILL: {
                return (
                  <TabContent style={style}>
                    <MusicbillList musicbillList={user.musicbillList} />
                  </TabContent>
                );
              }

              default:
                return null;
            }
          })}
        </div>
      </div>
      {miniInfoVisible ? <MiniInfo user={user} /> : null}
    </Style>
  );
}

function Wrapper({
  open,
  onClose,
  id,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
}) {
  const zIndex = useDynamicZIndex(EventType.OPEN_USER_DRAWER);
  const { data, reload } = useData(id);

  const transitions = useTransition(data, TRANSITION);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{
        style: { zIndex },
      }}
      bodyProps={bodyProps}
    >
      {transitions((style, d) => {
        const { error, loading, userDetail } = d;
        if (error) {
          return (
            <StatusContainer style={style}>
              <ErrorCard errorMessage={error.message} retry={reload} />
            </StatusContainer>
          );
        }
        if (loading) {
          return (
            <StatusContainer style={style}>
              <Spinner />
            </StatusContainer>
          );
        }
        return (
          <Container style={style}>
            <UserDetail user={userDetail!} />
          </Container>
        );
      })}
    </Drawer>
  );
}

export default Wrapper;
