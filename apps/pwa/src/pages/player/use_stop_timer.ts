import { useEffect, useState } from 'react';
import { StopTimer } from './constants';
import eventemitter, { EventType } from './eventemitter';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import day from '#/utils/day';

export default () => {
  const [stopTimer, setStopTimer] = useState<StopTimer | null>(null);

  useEffect(() => {
    const unlistenAddStopTimer = eventemitter.listen(
      EventType.ADD_STOP_TIMER,
      (payload) =>
        setStopTimer({
          endTimestamp: payload.endTimestamp,
        }),
    );
    return unlistenAddStopTimer;
  }, []);

  useEffect(() => {
    if (stopTimer) {
      const timer = globalThis.setTimeout(() => {
        dialog.alert({
          content: `${t('stop_timer_is_up')}(${day().format('HH:mm')})`,
        });
        eventemitter.emit(EventType.ACTION_PAUSE, null);
        return setStopTimer(null);
      }, stopTimer.endTimestamp - Date.now());
      return () => globalThis.clearTimeout(timer);
    }
  }, [stopTimer]);

  return stopTimer;
};
