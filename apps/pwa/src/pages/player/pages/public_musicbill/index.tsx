import { Navigate } from 'react-router-dom';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import useQuery from '@/utils/use_query';
import PublicMusicbill from './public_musicbill';

function Wrapper() {
  const { id } = useQuery<'id'>();
  if (!id) {
    return <Navigate to={ROOT_PATH.PLAYER + PLAYER_PATH.HOME} replace />;
  }
  return <PublicMusicbill id={id} />;
}

export default Wrapper;
