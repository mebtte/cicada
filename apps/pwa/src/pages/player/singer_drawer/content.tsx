import styled, { css } from 'styled-components';
import { useEffect, type ComponentProps } from 'react';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import autoScrollbar from '@/style/auto_scrollbar';
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components';
import Button from '@/components/button';
import useData from './use_data';
import { Singer } from './constants';
import Info from './info';
import Toolbar from './toolbar';
import MusicList from './music_list';
import playerEventemitter, { EventType } from '../eventemitter';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}
`;
const DetailContainer = styled(Container)`
  display: flex;
  flex-direction: column;

  > .scrollable {
    flex: 1;
    min-height: 0;

    overflow: auto;
    ${autoScrollbar}

    > .first-screen {
      min-height: 100%;
    }
  }
`;
const Header = styled(DrawerHeader)`
  height: 72px;
  padding: 0 16px 0 24px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
`;
const HeaderRow = styled.div`
  width: 100%;

  display: flex;
  align-items: center;
  gap: 12px;
`;
const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;
const titleStyle = css`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  && {
    color: rgb(50 50 50);
    font-weight: 800;
    font-size: 22px;
    line-height: 1.15;
    letter-spacing: 0.2px;
  }
`;
const SingerDrawerTitle = styled(DrawerTitle)`
  ${titleStyle}
`;
const descriptionStyle = css`
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  && {
    margin-top: 4px;
    color: rgb(140 140 140);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.1px;
  }
`;
const SingerDrawerDescription = styled(DrawerDescription)`
  ${descriptionStyle}
`;

type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

function Detail({
  style,
  singer,
  insideDrawer,
}: {
  style: AnimatedStyle;
  singer: Singer;
  insideDrawer: boolean;
}) {
  return (
    <DetailContainer style={style}>
      {insideDrawer ? (
        <Header>
          <HeaderRow>
            <HeaderText>
              <SingerDrawerTitle>{singer.name}</SingerDrawerTitle>
              {singer.aliases.length ? (
                <SingerDrawerDescription>
                  {singer.aliases.join(' / ')}
                </SingerDrawerDescription>
              ) : null}
            </HeaderText>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" square aria-label="Close">
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </Button>
            </DrawerClose>
          </HeaderRow>
        </Header>
      ) : null}
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
      </div>
      <Toolbar singer={singer} />
    </DetailContainer>
  );
}

function SingerContent({
  id,
  insideDrawer = false,
}: {
  id: string;
  insideDrawer?: boolean;
}) {
  const { data, reload } = useData(id);

  useEffect(() => {
    if (!insideDrawer && data.value) {
      playerEventemitter.emit(EventType.SINGER_DETAIL_LOADED, {
        id: data.value.id,
        name: data.value.name,
        aliases: data.value.aliases,
      });
    }
  }, [data.value, insideDrawer]);

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
    return (
      <Detail style={style} singer={d.value} insideDrawer={insideDrawer} />
    );
  });
}

export default SingerContent;
