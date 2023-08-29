import { useEffect, useState } from 'react';
import setting from '@/global_states/setting';
import throttle from 'lodash/throttle';
import uploadMusicPlayRecord from '@/server/base/upload_music_play_record';
import { EFFECTIVE_PLAY_PERCENT } from '#/constants';
import definition from '@/definition';
import { CacheName } from '@/constants/cache';
import logger from '@/utils/logger';
import { QueueMusic } from '../constants';
import onError from './on_error';
import eventemitter, { EventType } from '../eventemitter';

function getAudioPlayedSeconeds(audio: HTMLAudioElement) {
  const { played } = audio;
  let playedSeconeds = 0;
  for (let i = 0, { length } = played; i < length; i += 1) {
    const start = played.start(i);
    const end = played.end(i);
    playedSeconeds += end - start;
  }
  return playedSeconeds;
}
function uploadPlayRecord(audio: HTMLAudioElement, musicId: string) {
  const { duration } = audio;
  const playedSeconds = getAudioPlayedSeconeds(audio);
  return uploadMusicPlayRecord({
    musicId,
    percent: duration ? playedSeconds / duration : 0,
  });
}

function Audio({ queueMusic }: { queueMusic?: QueueMusic }) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { playerVolume } = setting.useState();

  useEffect(() => {
    if (queueMusic) {
      const newAudio = new window.Audio();
      newAudio.crossOrigin = 'anonymous';
      newAudio.autoplay = true;
      newAudio.loop = false;
      newAudio.src = queueMusic.asset;

      eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: 0,
      });

      newAudio.addEventListener('canplaythrough', () =>
        eventemitter.emit(EventType.AUDIO_CAN_PLAY_THROUGH, {
          duration: newAudio.duration,
        }),
      );
      newAudio.addEventListener('play', () =>
        eventemitter.emit(EventType.AUDIO_PLAY, null),
      );
      newAudio.addEventListener('pause', () =>
        eventemitter.emit(EventType.AUDIO_PAUSE, null),
      );
      newAudio.addEventListener(
        'timeupdate',
        throttle(
          () =>
            eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
              currentMillisecond: newAudio.currentTime * 1000,
            }),
          300,
        ),
      );
      newAudio.addEventListener('ended', () =>
        eventemitter.emit(EventType.ACTION_NEXT, null),
      );
      newAudio.addEventListener('error', onError);
      newAudio.addEventListener('waiting', () =>
        eventemitter.emit(EventType.AUDIO_WAITING, null),
      );
      newAudio.addEventListener('playing', () => {});
      newAudio.addEventListener('progress', () => {});
      // abort
      // canplay
      // durationchange
      // emptied
      // loaddata
      // loadstart
      // loadeddata
      // loadedmetadata
      // ratechange
      // seeked
      // seeking
      // stalled
      // suspend
      // volumechange

      setAudio(newAudio);
      return () => {
        newAudio.pause();
        uploadPlayRecord(newAudio, queueMusic.id);

        /**
         * workbox 不支持缓存媒体
         * 需要手动进行缓存
         * 详情查看 https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video
         * @author mebtte<hi@mebtte.com>
         */
        if (
          definition.WITH_SW &&
          window.caches &&
          newAudio.duration &&
          getAudioPlayedSeconeds(newAudio) / newAudio.duration >
            EFFECTIVE_PLAY_PERCENT
        ) {
          window.caches.open(CacheName.ASSET_MEDIA).then(async (cache) => {
            const exist = await cache.match(queueMusic.asset);
            if (!exist) {
              cache
                .add(queueMusic.asset)
                .catch((error) =>
                  logger.error(
                    error,
                    `Failed to cache music "${queueMusic.asset}"`,
                  ),
                );
            }
          });
        }
      };
    }
  }, [queueMusic]);

  useEffect(() => {
    if (audio) {
      audio.volume = playerVolume;
    }
  }, [audio, playerVolume]);

  useEffect(() => {
    if (audio) {
      const unlistenActionSetTime = eventemitter.listen(
        EventType.ACTION_SET_TIME,
        ({ second }: { second: number }) =>
          window.setTimeout(() => {
            audio.currentTime = second;
            audio.play();
            eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
              currentMillisecond: second * 1000,
            });
          }, 0),
      );
      const unlistenActionPlay = eventemitter.listen(
        EventType.ACTION_PLAY,
        () => audio.play(),
      );
      const unlistenActionPause = eventemitter.listen(
        EventType.ACTION_PAUSE,
        () => audio.pause(),
      );
      const unlistenActionTogglePlay = eventemitter.listen(
        EventType.ACTION_TOGGLE_PLAY,
        () => (audio.paused ? audio.play() : audio.pause()),
      );
      return () => {
        unlistenActionSetTime();
        unlistenActionPlay();
        unlistenActionPause();
        unlistenActionTogglePlay();
      };
    }
  }, [audio]);

  useEffect(() => {
    if (audio && queueMusic) {
      const onBeforeUnload = () => uploadPlayRecord(audio, queueMusic.id);
      window.addEventListener('beforeunload', onBeforeUnload);
      return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }
  }, [audio, queueMusic]);
}

export default Audio;
