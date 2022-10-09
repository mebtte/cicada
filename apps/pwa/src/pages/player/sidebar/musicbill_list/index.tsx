import styled from 'styled-components';
import Top from './top';
import MusicbillList from './musicbill_list';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

function Wrapper() {
  return (
    <Style>
      <Top />
      <MusicbillList />
    </Style>
  );
}

export default Wrapper;
