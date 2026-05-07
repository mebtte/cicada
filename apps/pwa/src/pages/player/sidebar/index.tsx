import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { WIDTH } from './constants';
import Content from './content';
import MiniMode from './mini_mode';
import { useTheme } from '@/global_states/theme';

const Placeholder = styled.div`
  flex: 0 0 ${WIDTH}px;
  width: ${WIDTH}px;

  border-right: 2px solid ${CSSVariable.COLOR_BORDER};
  background: #fff;
  box-shadow: 4px 0 0 rgb(232 232 232 / 0.35);
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
