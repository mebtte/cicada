import mm from '@/global_states/mini_mode';
import styled from 'styled-components';
import { WIDTH } from './constants';
import Content from './content';
import MiniMode from './mini_mode';

const Placeholder = styled.div`
  width: ${WIDTH}px;

  background-color: rgb(0 0 0 / 0.01);
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
