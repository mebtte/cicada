import SingerDrawer from './singer_drawer';
import useOpen from './use_open';

function Wrapper() {
  const { singerId, open, onClose } = useOpen();

  if (!singerId) {
    return null;
  }
  return <SingerDrawer open={open} onClose={onClose} singerId={singerId} />;
}

export default Wrapper;
