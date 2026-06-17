import { useEffect, useState } from 'react';
import { ZIndex } from './constants';
import e, { EventType } from './eventemitter';

let current = ZIndex.DYNAMIC_START;
let lastEventType: EventType | null = null;

function useDynamicZIndex(eventType: EventType) {
  const [zIndex, setZIndex] = useState(current);

  useEffect(() => {
    const unlisten = e.listen(eventType, () => {
      if (lastEventType !== eventType) {
        lastEventType = eventType;
        // Drawer has an overlay at zIndex and a panel at zIndex + 1,
        // so each activation needs to reserve two layers.
        current += 2;
        setZIndex(current);
      }
    });
    return unlisten;
  }, [eventType]);

  return zIndex;
}

export default useDynamicZIndex;
