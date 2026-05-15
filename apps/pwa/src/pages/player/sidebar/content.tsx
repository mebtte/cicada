import styled from 'styled-components';
import Profile from './profile';
import MusicbillList from './musicbill_list';
import Menu from './menu';

const Style = styled.div`
  min-height: 100%;
  padding: 18px 0 0;

  display: flex;
  flex-direction: column;
  gap: 16px;
`;

function Content() {
  return (
    <Style>
      <Profile />
      <Menu />
      <MusicbillList />
    </Style>
  );
}

export default Content;
