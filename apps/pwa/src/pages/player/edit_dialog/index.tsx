import { useEffect, useState } from 'react';
import EditDialog from './edit_dialog';
import e, { EditDialogData, EventType } from '../eventemitter';

function Wrapper() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<EditDialogData | null>(null);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_EDIT_DIALOG, (d) => {
      setData(d);
      window.setTimeout(() => setOpen(true), 0);
    });
    return unlistenOpen;
  }, []);

  if (!data) {
    return null;
  }
  return <EditDialog open={open} onClose={() => setOpen(false)} data={data} />;
}

export default Wrapper;
