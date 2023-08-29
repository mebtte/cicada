import dialog from '@/utils/dialog';
import { useEffect, useMemo, useState } from 'react';
import { t } from '@/i18n';
import eventemitter, { EventType } from '../eventemitter';

const next = () => eventemitter.emit(EventType.ACTION_NEXT, null);
function CoundDown({ getId }: { getId: () => string }) {
  const endTimestamp = useMemo(() => Date.now() + 1000 * 15, []);
  const [countdown, setCountdown] = useState(() => endTimestamp - Date.now());

  useEffect(() => {
    const timer = window.setInterval(
      () => setCountdown(endTimestamp - Date.now()),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [endTimestamp]);

  useEffect(() => {
    if (countdown <= 0) {
      next();
    }
  }, [countdown, getId]);

  useEffect(() => {
    const unlistenCurrentMusicChange = eventemitter.listen(
      EventType.CURRENT_MUSIC_CHANGE,
      () => dialog.close(getId()),
    );
    return unlistenCurrentMusicChange;
  }, [getId]);

  return (
    <>
      {t(
        'auto_play_next_after_seconds',
        (countdown >= 0 ? Math.round(countdown / 1000) : 0).toString(),
      )}
    </>
  );
}

function onError() {
  const id = dialog.confirm({
    title: t('failed_to_play'),
    content: <CoundDown getId={() => id} />,
    confirmText: t('next_music'),
    onConfirm: next,
  });
  return eventemitter.emit(EventType.AUDIO_ERROR, null);
}

export default onError;
