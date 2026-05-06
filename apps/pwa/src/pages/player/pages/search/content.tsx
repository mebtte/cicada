import { DuolingoTabPanels } from '@/components/duolingo_tabs';
import styled, { css } from 'styled-components';
import Music from './music';
import Singer from './singer';
import Lyric from './lyric';
import PublicMusicbill from './public_musicbill';
import { SearchTab } from '../../constants';
import { MINI_MODE_TOOLBAR_HEIGHT, TOOLBAR_HEIGHT } from './constants';

const Container = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;

  ${({ theme: { miniMode } }) => css`
    top: ${miniMode ? MINI_MODE_TOOLBAR_HEIGHT : TOOLBAR_HEIGHT}px;
  `}
`;

function Content({ tab }: { tab: SearchTab }) {
  return (
    <Container>
      <DuolingoTabPanels<SearchTab>
        current={tab}
        tabList={[
          {
            tab: SearchTab.MUSIC,
            content: <Music />,
          },
          {
            tab: SearchTab.SINGER,
            content: <Singer />,
          },
          {
            tab: SearchTab.PUBLIC_MUSICBILL,
            content: <PublicMusicbill />,
          },
          {
            tab: SearchTab.LYRIC,
            content: <Lyric />,
          },
        ]}
      />
    </Container>
  );
}

export default Content;
