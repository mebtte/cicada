import styled from 'styled-components';
import Profile from './profile';
import MusicbillList from './musicbill_list';
import Menu from './menu';

const Style = styled.div`
  padding-top: 30px;

  display: flex;
  flex-direction: column;
  gap: 20px;
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
