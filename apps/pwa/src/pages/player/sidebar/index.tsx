import { CSSVariable } from '@/global_style';
import mm from '@/global_states/mini_mode';
import styled from 'styled-components';
import { WIDTH } from './constants';
import Content from './content';
import MiniMode from './mini_mode';

const Placeholder = styled.div`
  width: ${WIDTH}px;

  background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  overflow: auto;
`;

function Sidebar() {
  const miniMode = mm.useState();
  if (miniMode) {
    return <MiniMode />;
  }
  return (
    <Placeholder>
      <Content />
    </Placeholder>
  );
}

export default Sidebar;
