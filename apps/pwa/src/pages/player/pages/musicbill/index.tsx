import { useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Context from '../../context';
import Musicbill from './musicbill';
import EditMenu from './edit_menu';
import ShareDrawer from './share_drawer';
import RedirectLater from './redirect_later';

function Wrapper() {
  const { id } = useParams<{ id: string }>();
  const { musicbillList } = useContext(Context);
  const musicbill = useMemo(
    () => musicbillList.find((m) => m.id === id),
    [musicbillList, id],
  );

  if (musicbill) {
    return (
      <>
        <Musicbill musicbill={musicbill} />
        <EditMenu musicbill={musicbill} />
        <ShareDrawer musicbill={musicbill} />
      </>
    );
  }
  return <RedirectLater />;
}

export default Wrapper;
