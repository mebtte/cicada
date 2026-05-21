import dialog from '@/utils/dialog';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import { QueueMusic } from '../constants';
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

const NextMusic = styled.div`
  padding: 12px 14px 14px;

  color: rgb(130 87 0);
  background: rgb(255 248 224);
  border: 2px solid rgb(245 176 43);
  border-radius: 14px;
  box-shadow: 0 4px 0 rgb(221 151 24);

  > .label {
    margin-bottom: 4px;

    color: ${CSSVariable.COLOR_PRIMARY};
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 900;
  }

  > .name {
    color: rgb(130 87 0);
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 900;
  }

  > .singers {
    margin-top: 2px;

    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  }
`;

function closeErrorDialog(id: string) {
  dialog.close(id);
  if (activeDialogId === id) {
    activeDialogId = null;
  }
}

function NextMusicPreview({ queueMusic }: { queueMusic: QueueMusic }) {
  return (
    <NextMusic>
      <div className="label">{t('next_music')}</div>
      <div className="name">{queueMusic.name}</div>
      <div className="singers">
        {queueMusic.singers.map((singer) => singer.name).join(' / ')}
      </div>
    </NextMusic>
  );
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
  nextQueueMusic,
}: {
  getId: () => string;
  nextQueueMusic?: QueueMusic;
}) {
  const playNext = useCallback(() => {
    next();
    closeErrorDialog(getId());
  }, [getId]);

  return (
    <Content>
      <Countdown getId={getId} onTimeout={playNext} />
      {nextQueueMusic ? <NextMusicPreview queueMusic={nextQueueMusic} /> : null}
    </Content>
  );
}

function onError({
  nextQueueMusic,
}: {
  nextQueueMusic?: QueueMusic;
} = {}) {
  if (activeDialogId) {
    closeErrorDialog(activeDialogId);
  }

  let id = '';
  id = dialog.confirm({
    title: t('failed_to_play'),
    content: (
      <PlaybackErrorContent
        getId={() => id}
        nextQueueMusic={nextQueueMusic}
      />
    ),
    confirmText: t('next_music'),
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
