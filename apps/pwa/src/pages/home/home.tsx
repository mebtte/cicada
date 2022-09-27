import { ROOT_PATH } from '@/constants/route';
import { Navigate } from 'react-router-dom';

function Home() {
  return <Navigate replace to={ROOT_PATH.PLAYER} />;
}

export default Home;
