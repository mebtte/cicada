import { useEffect, useRef } from 'react';
import uploadMusicPlayRecord from '@/server/base/upload_music_play_record';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '../constants';

interface PlayRecordDraft {
  musicId: string;
  percent: number;
}

interface PendingUpload {
  draft: PlayRecordDraft;
  timer: number;
}

function getPlayRecordDraft(audio: CustomAudio<QueueMusic>): PlayRecordDraft {
  const duration = audio.getDuration();
  const playedSeconds = audio.getPlayedSeconds();
  return {
    musicId: audio.extra.id,
    percent: duration ? playedSeconds / duration : 0,
  };
}

function mergePlayRecordDraft(
  a: PlayRecordDraft | null,
  b: PlayRecordDraft,
) {
  if (!a || a.musicId !== b.musicId) {
    return b;
  }
  return {
    musicId: b.musicId,
    percent: Math.max(a.percent, b.percent),
  };
}

function uploadPlayRecord(draft: PlayRecordDraft) {
  return uploadMusicPlayRecord(draft);
}

export default (audio: CustomAudio<QueueMusic> | null) => {
  const carriedDraftRef = useRef<PlayRecordDraft | null>(null);
  const pendingUploadRef = useRef<PendingUpload | null>(null);

  useEffect(() => {
    if (audio) {
      const pendingUpload = pendingUploadRef.current;
      if (pendingUpload?.draft.musicId === audio.extra.id) {
        window.clearTimeout(pendingUpload.timer);
        pendingUploadRef.current = null;
        carriedDraftRef.current = mergePlayRecordDraft(
          carriedDraftRef.current,
          pendingUpload.draft,
        );
      }

      const onBeforeUnload = () =>
        uploadPlayRecord(
          mergePlayRecordDraft(
            carriedDraftRef.current,
            getPlayRecordDraft(audio),
          ),
        );
      window.addEventListener('beforeunload', onBeforeUnload);
      return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }
  }, [audio]);

  useEffect(() => {
    if (audio) {
      return () => {
        const draft = mergePlayRecordDraft(
          carriedDraftRef.current,
          getPlayRecordDraft(audio),
        );
        carriedDraftRef.current = null;

        const timer = window.setTimeout(() => {
          uploadPlayRecord(draft);
          if (pendingUploadRef.current?.timer === timer) {
            pendingUploadRef.current = null;
          }
        });
        pendingUploadRef.current = {
          draft,
          timer,
        };
      };
    }
  }, [audio]);
};
