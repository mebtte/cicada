import { ROOT_PATH } from '@/constants/route';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Style = styled.div``;

function Home() {
  return (
    <Style>
      <div>home</div>
      <Link to={ROOT_PATH.LOGIN}>login</Link>
    </Style>
  );
}

export default Home;
