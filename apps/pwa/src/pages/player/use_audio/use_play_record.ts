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
    musicId: audio.extra!.id,
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

/**
 * audio 实例已改为长期单例 (避免 iOS Safari 锁屏失效),
 * 切歌不再让 audio 引用变化, 因此通过 queueMusic 作为依赖触发
 * cleanup 上传上一首的播放记录.
 *
 * 时序保证: usePlayRecord 在 useAudio 内部声明早于 setSource effect,
 * effect cleanup 反向执行, 因此 cleanup 跑时 audio.extra 仍是上一首.
 * @author mebtte<i@mebtte.com>
 */
export default (
  audio: CustomAudio<QueueMusic> | null,
  queueMusic: QueueMusic | undefined,
) => {
  const carriedDraftRef = useRef<PlayRecordDraft | null>(null);
  const pendingUploadRef = useRef<PendingUpload | null>(null);

  useEffect(() => {
    if (audio && queueMusic) {
      // 用户切回上一首前正好处于延迟上传窗口, 合并记录避免覆盖.
      const pendingUpload = pendingUploadRef.current;
      if (pendingUpload?.draft.musicId === queueMusic.id) {
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
  }, [audio, queueMusic]);

  useEffect(() => {
    if (audio && queueMusic) {
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
  }, [audio, queueMusic]);
};
