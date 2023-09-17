import { useTransition, animated } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import Spinner from '@/components/spinner';
import Cover from '@/components/cover';
import autoScrollbar from '@/style/auto_scrollbar';
import useData from './use_data';
import { MusicDetail } from './constants';
import CreateUser from './create_user';
import SingerList from './singer_list';
import Toolbar from './toolbar';
import Lyric from './lyric';
import SubMusicList from './sub_music_list';
import EditMenu from './edit_menu';
import Info from './info';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 'min(350px, 85%)',
  },
};
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusBox = styled(Container)`
  ${flexCenter}
`;
const DetailBox = styled(Container)`
  > .scrollable {
    ${absoluteFullSize}

    overflow: auto;
    ${autoScrollbar}

    > .first-screen {
      min-height: 100dvb;
    }
  }
`;
const createUserStyle: CSSProperties = {
  padding: '30px 20px',
};

function Detail({ style, music }: { style: unknown; music: MusicDetail }) {
  return (
    // @ts-expect-error
    <DetailBox style={style}>
      <div className="scrollable">
        <div className="first-screen">
          <Cover src={music.cover} size="100%" />
          <Info music={music} />
          <SingerList singerList={music.singers} />
          {music.forkFromList.length ? (
            <SubMusicList
              label="二次创作自以下音乐"
              musicList={music.forkFromList}
            />
          ) : null}
          {music.forkList.length ? (
            <SubMusicList
              label="被以下音乐二次创作"
              musicList={music.forkList}
            />
          ) : null}
          <Lyric music={music} />
        </div>
        <CreateUser
          user={music.createUser}
          createTime={music.createTime}
          style={createUserStyle}
        />
        <Toolbar music={music} />
      </div>

      <EditMenu music={music} />
    </DetailBox>
  );
}

function MusicDrawer({
  zIndex,
  id,
  open,
  onClose,
}: {
  zIndex: number;
  id: string;
  open: boolean;
  onClose: () => void;
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
            <StatusBox style={style}>
              <ErrorCard errorMessage={d.error.message} retry={reload} />
            </StatusBox>
          );
        }

        if (d.loading) {
          return (
            <StatusBox style={style}>
              <Spinner />
            </StatusBox>
          );
        }

        return <Detail style={style} music={d.music!} />;
      })}
    </Drawer>
  );
}

export default MusicDrawer;
