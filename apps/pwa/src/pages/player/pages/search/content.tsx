import absoluteFullSize from '@/style/absolute_full_size';
import { ReactNode } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import Music from './music';
import Singer from './singer';
import Lyric from './lyric';
import Musicbill from './musicbill';
import { SearchTab } from '../../constants';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;

function Content({ tab }: { tab: SearchTab }) {
  const transitions = useTransition(tab, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return transitions((style, t) => {
    let content: ReactNode = null;
    switch (t) {
      case SearchTab.MUSIC: {
        content = <Music />;
        break;
      }
      case SearchTab.SINGER: {
        content = <Singer />;
        break;
      }
      case SearchTab.MUSICBILL: {
        content = <Musicbill />;
        break;
      }
      case SearchTab.LYRIC: {
        content = <Lyric />;
        break;
      }
    }
    return <Container style={style}>{content}</Container>;
  });
}

export default Content;
