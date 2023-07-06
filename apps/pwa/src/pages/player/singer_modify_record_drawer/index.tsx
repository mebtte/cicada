import useOpen from './use_open';
import SingerModifyRecordDrawer from './singer_modify_record_drawer';

function Wrapper() {
  const { singer, open, onClose } = useOpen();

  if (!singer) {
    return null;
  }
  return (
    <SingerModifyRecordDrawer singer={singer} open={open} onClose={onClose} />
  );
}

export default Wrapper;
