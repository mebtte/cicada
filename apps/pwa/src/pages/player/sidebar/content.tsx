import styled from 'styled-components';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import Profile from './profile';
import MusicbillList from './musicbill_list';
import Menu from './menu';

const TOP_PADDING = 18;

const Style = styled.div`
  min-height: 100%;
  padding: ${TOP_PADDING}px 0 0;

  display: flex;
  flex-direction: column;
  gap: 16px;
`;

function Content() {
  const { top: titlebarTop, left: titlebarLeft } = useTitlebarOverlayInsets();
  // macOS window-controls-overlay puts traffic lights above the left sidebar.
  const topPadding = titlebarLeft
    ? titlebarTop + TOP_PADDING
    : TOP_PADDING;

  return (
    <Style style={{ paddingTop: topPadding }}>
      <Profile />
      <Menu />
      <MusicbillList />
    </Style>
  );
}

export default Content;
