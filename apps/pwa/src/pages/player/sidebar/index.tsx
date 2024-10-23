import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { WIDTH } from './constants';
import Content from './content';
import MiniMode from './mini_mode';
import { useTheme } from '@/global_states/theme';

const Placeholder = styled.div`
  width: ${WIDTH}px;

  border-right: 1px solid transparent;
  background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  overflow: auto;
  ${autoScrollbar}
`;

function Sidebar() {
  if (useTheme().miniMode) {
    return <MiniMode />;
  }
  return (
    <Placeholder>
      <Content />
    </Placeholder>
  );
}

export default Sidebar;
