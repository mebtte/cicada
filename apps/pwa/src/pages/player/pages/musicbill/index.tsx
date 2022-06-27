import { useContext, useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ROOT_PATH } from '@/constants/route';
import Context from '../../context';
import Musicbill from './musicbill';

function Wrapper() {
  const { id } = useParams<{ id: string }>();
  const { musicbillList } = useContext(Context);
  const musicbill = useMemo(
    () => musicbillList.find((m) => m.id === id),
    [musicbillList, id],
  );

  if (musicbill) {
    return <Musicbill musicbill={musicbill} />;
  }
  return <Navigate to={ROOT_PATH.PLAYER} replace />;
}

export default Wrapper;
