import SingerDrawer from './singer_drawer';
import useOpen from './use_open';

function Wrapper() {
  const { zIndex, id, open, onClose } = useOpen();

  if (!id) {
    return null;
  }
  return <SingerDrawer open={open} onClose={onClose} id={id} zIndex={zIndex} />;
}

export default Wrapper;
