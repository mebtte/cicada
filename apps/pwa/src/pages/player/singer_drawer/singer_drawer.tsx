import styled from 'styled-components';
import Drawer from '@/components/drawer';
import { CSSProperties, UIEventHandler, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import useData from './use_data';
import { MINI_INFO_HEIGHT, Singer } from './constants';
import Info from './info';
import Toolbar from './toolbar';
import MusicList from './music_list';
import CreateUser from './create_user';
import MiniIfno from './mini_info';
import EditMenu from './edit_menu';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 'min(85%, 400px)',
  },
};
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}
`;
const DetailContainer = styled(Container)`
  > .scrollable {
    ${absoluteFullSize}

    overflow: auto;

    > .first-screen {
      min-height: 100vh;
    }
  }
`;

function Detail({ style, singer }: { style: unknown; singer: Singer }) {
  const [toolbarSticky, setToolbarSticky] = useState(false);

  const onScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop, clientWidth } = event.target as HTMLDivElement;
    setToolbarSticky(scrollTop >= clientWidth - MINI_INFO_HEIGHT);
  };
  return (
    // @ts-expect-error
    <DetailContainer style={style}>
      <div className="scrollable" onScroll={onScroll}>
        <div className="first-screen">
          <Info singer={singer} />
          <Toolbar singer={singer} />
          <MusicList
            musicList={singer.musicList.map((m, index) => ({
              ...m,
              index: singer.musicList.length - index,
            }))}
          />
        </div>
        <CreateUser
          user={singer.createUser}
          createTimestamp={singer.createTimestamp}
        />
      </div>

      {toolbarSticky ? <MiniIfno singer={singer} /> : null}
      <EditMenu singer={singer} />
    </DetailContainer>
  );
}

function SingerDrawer({
  zIndex,
  open,
  onClose,
  id,
}: {
  zIndex: number;
  open: boolean;
  onClose: () => void;
  id: string;
}) {
  const { data, reload } = useData(id);

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      {transitions((style, d) => {
        if (d.error) {
          return (
            <CardContainer style={style}>
              <ErrorCard errorMessage={d.error.message} retry={reload} />
            </CardContainer>
          );
        }
        if (d.loading) {
          return (
            <CardContainer style={style}>
              <Spinner />
            </CardContainer>
          );
        }
        return <Detail style={style} singer={d.value} />;
      })}
    </Drawer>
  );
}

export default SingerDrawer;
