import type { ComponentProps } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Cover, { Shape } from '@/components/cover';
import Spinner from '@/components/spinner';
import absoluteFullSize from '@/style/absolute_full_size';
import autoScrollbar from '@/style/auto_scrollbar';
import { flexCenter } from '@/style/flexbox';
import { t } from '@/i18n';
import CreateUser from '../components/create_user';
import Info from './info';
import { MusicDetail } from './constants';
import Lyric from './lyric';
import SingerList from './singer_list';
import SubMusicList from './sub_music_list';
import Toolbar from './toolbar';
import useData from './use_data';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../constants';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusBox = styled(Container)`
  ${flexCenter}
`;
const DetailBox = styled(Container)<{ $floatingControllerOffset: boolean }>`
  > .scrollable {
    ${absoluteFullSize}

    overflow: auto;
    ${autoScrollbar}

    > .first-screen {
      min-height: 100%;
    }

    &::after {
      content: '';
      display: block;
      height: ${({ $floatingControllerOffset }) =>
        $floatingControllerOffset ? FLOATING_CONTROLLER_SCROLL_SPACE : 0};
    }
  }
`;

type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

function Detail({
  style,
  music,
  floatingControllerOffset,
}: {
  style: AnimatedStyle;
  music: MusicDetail;
  floatingControllerOffset: boolean;
}) {
  return (
    <DetailBox
      style={style}
      $floatingControllerOffset={floatingControllerOffset}
    >
      <div className="scrollable">
        <div className="first-screen">
          <Cover src={music.cover} size="100%" shape={Shape.SQUARE} />
          <Info music={music} />
          <SingerList singerList={music.singers} />
          {music.forkFromList.length ? (
            <SubMusicList
              label={t('fork_from_these_musics')}
              musicList={music.forkFromList}
            />
          ) : null}
          {music.forkList.length ? (
            <SubMusicList
              label={t('forked_by_these_musics')}
              musicList={music.forkList}
            />
          ) : null}
          <Lyric music={music} />
        </div>
        <CreateUser
          userId={music.createUser.id}
          nickname={music.createUser.nickname}
          createTime={music.createTime}
        />
        <Toolbar
          music={music}
          floatingControllerOffset={floatingControllerOffset}
        />
      </div>
    </DetailBox>
  );
}

function MusicContent({
  id,
  floatingControllerOffset = false,
}: {
  id: string;
  floatingControllerOffset?: boolean;
}) {
  const { data, reload } = useData(id);
  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return transitions((style, d) => {
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

    return (
      <Detail
        style={style}
        music={d.music!}
        floatingControllerOffset={floatingControllerOffset}
      />
    );
  });
}

export default MusicContent;
