import XState from '#/utils/x_state';
import { ZIndex } from './constants';
import e, { EventType } from './eventemitter';

const drawerZIndex = new XState<{
  lastEventType: EventType | null;
  zIndex: number;
}>({
  lastEventType: null,
  zIndex: ZIndex.DRAWER as number,
});
const onIncrease = (eventType: EventType) =>
  drawerZIndex.set((d) =>
    d.lastEventType === eventType
      ? d
      : {
          lastEventType: eventType,
          zIndex: d.zIndex + 1,
        },
  );
e.listen(EventType.OPEN_SINGER_DRAWER, () =>
  onIncrease(EventType.OPEN_SINGER_DRAWER),
);

export default drawerZIndex;
