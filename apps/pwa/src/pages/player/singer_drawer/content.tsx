import styled from 'styled-components';
import type { ComponentProps } from 'react';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import autoScrollbar from '@/style/auto_scrollbar';
import day from '#/utils/day';
import useData from './use_data';
import { Singer } from './constants';
import Info from './info';
import Toolbar from './toolbar';
import MusicList from './music_list';
import CreateUser from '../components/create_user';
import EditMenu from './edit_menu';

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
    ${autoScrollbar}

    > .first-screen {
      min-height: 100%;
    }
  }
`;

type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

function Detail({ style, singer }: { style: AnimatedStyle; singer: Singer }) {
  const hasCreateUser = !!singer.createUser.id && !!singer.createUser.nickname;
  return (
    <DetailContainer style={style}>
      <div className="scrollable">
        <div className="first-screen">
          <Info singer={singer} />
          <MusicList
            musicList={singer.musicList.map((m, index) => ({
              ...m,
              index: singer.musicList.length - index,
            }))}
          />
        </div>
        {hasCreateUser ? (
          <CreateUser
            userId={singer.createUser.id}
            nickname={singer.createUser.nickname}
            createTime={day(singer.createTimestamp).format('YYYY-MM-DD')}
          />
        ) : null}
        <Toolbar singer={singer} />
      </div>

      <EditMenu singer={singer} />
    </DetailContainer>
  );
}

function SingerContent({ id }: { id: string }) {
  const { data, reload } = useData(id);

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return transitions((style, d) => {
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
  });
}

export default SingerContent;
