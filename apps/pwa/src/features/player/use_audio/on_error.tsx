import dialog from '@/utils/dialog';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import eventemitter, { EventType } from '../eventemitter';

const next = () => eventemitter.emit(EventType.ACTION_NEXT, null);
let activeDialogId: string | null = null;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  font-weight: 700;
`;

function closeErrorDialog(id: string) {
  dialog.close(id);
  if (activeDialogId === id) {
    activeDialogId = null;
  }
}

function Countdown({
  getId,
  onTimeout,
}: {
  getId: () => string;
  onTimeout: () => void;
}) {
  const endTimestamp = useMemo(() => Date.now() + 1000 * 15, []);
  const [countdown, setCountdown] = useState(() => endTimestamp - Date.now());
  const timeoutHandledRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(
      () => setCountdown(endTimestamp - Date.now()),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [endTimestamp]);

  useEffect(() => {
    if (countdown <= 0 && !timeoutHandledRef.current) {
      timeoutHandledRef.current = true;
      onTimeout();
    }
  }, [countdown, onTimeout]);

  useEffect(() => {
    const unlistenCurrentMusicChange = eventemitter.listen(
      EventType.CURRENT_MUSIC_CHANGE,
      () => closeErrorDialog(getId()),
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

function PlaybackErrorContent({
  getId,
}: {
  getId: () => string;
}) {
  const playNext = useCallback(() => {
    next();
    closeErrorDialog(getId());
  }, [getId]);

  return (
    <Content>
      <Countdown getId={getId} onTimeout={playNext} />
    </Content>
  );
}

function onError() {
  if (activeDialogId) {
    closeErrorDialog(activeDialogId);
  }

  let id = '';
  id = dialog.confirm({
    title: t('failed_to_play'),
    content: <PlaybackErrorContent getId={() => id} />,
    confirmText: t('next_music'),
    // Playback failure recovery should make the skip action visually primary.
    confirmVariant: 'primary',
    onCancel: () => {
      activeDialogId = null;
    },
    onConfirm: () => {
      activeDialogId = null;
      next();
    },
  });
  activeDialogId = id;
}

export default onError;
