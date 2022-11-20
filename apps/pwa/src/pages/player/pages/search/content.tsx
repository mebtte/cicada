import absoluteFullSize from '#/style/absolute_full_size';
import { ReactNode } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { Tab } from './constants';
import Music from './music';
import Singer from './singer';
import Lyric from './lyric';
import Musicbill from './musicbill';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;

function Content({ tab, exploration }: { tab: Tab; exploration: boolean }) {
  const transitions = useTransition(tab, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return transitions((style, t) => {
    let content: ReactNode = null;
    switch (t) {
      case Tab.MUSIC: {
        content = <Music exploration={exploration} />;
        break;
      }
      case Tab.SINGER: {
        content = <Singer exploration={exploration} />;
        break;
      }
      case Tab.MUSICBILL: {
        content = <Musicbill exploration={exploration} />;
        break;
      }
      case Tab.LYRIC: {
        content = <Lyric />;
        break;
      }
    }
    return <Container style={style}>{content}</Container>;
  });
}

export default Content;
