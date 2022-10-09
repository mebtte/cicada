import styled from 'styled-components';
import Profile from './profile';

const Style = styled.div`
  padding: 30px 0;

  display: flex;
  flex-direction: column;
  gap: 30px;
`;

function Content() {
  return (
    <Style>
      <Profile />
    </Style>
  );
}

export default Content;
