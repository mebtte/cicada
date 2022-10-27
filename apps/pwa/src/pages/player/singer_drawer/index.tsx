import SingerDrawer from './singer_drawer';
import useOpen from './use_open';

function Wrapper() {
  const { zIndex, singerId, open, onClose } = useOpen();

  if (!singerId) {
    return null;
  }
  return (
    <SingerDrawer
      open={open}
      onClose={onClose}
      singerId={singerId}
      zIndex={zIndex}
    />
  );
}

export default Wrapper;
