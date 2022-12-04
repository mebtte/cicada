import { useEffect, useState } from 'react';
import Controller from './controller';

function Wrapper({ lyricPanelOpen }: { lyricPanelOpen: boolean }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (lyricPanelOpen) {
      const timer = window.setTimeout(() => setVisible(false), 1000);
      return () => window.clearTimeout(timer);
    }
    setVisible(true);
  }, [lyricPanelOpen]);

  return visible ? <Controller /> : null;
}

export default Wrapper;
