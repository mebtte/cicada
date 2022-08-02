/* eslint-disable react/destructuring-assignment */
import * as React from 'react';
import throttle from 'lodash/throttle';
import keyboardHandlerWrapper from '@/utils/keyboard_handler_wrapper';
import uploadMusicPlayRecord from '@/server/upload_music_play_record';
import logger from '#/utils/logger';
import { CacheName } from '@/constants/cache';
import volumeState from './share_states/volume';
import eventemitter, { EventType } from './eventemitter';
import dialog from '../../platform/dialog';
import { QueueMusic, PlayMode, Music } from './constants';

const JUMP_STEP = 5;
const style = {
  display: 'none',
};
const onWaiting = () => eventemitter.emit(EventType.AUDIO_WAITING);
const onCanPlayThrough = (event) => {
  const { duration } = event.target;
  return eventemitter.emit(EventType.AUDIO_CAN_PLAY_THROUGH, { duration });
};
const onPlay = () => eventemitter.emit(EventType.AUDIO_PLAY);
const onPause = () => eventemitter.emit(EventType.AUDIO_PAUSE);
const onEnded = () => eventemitter.emit(EventType.ACTION_NEXT);
const onError = (e) => {
  logger.error(e, '播放发生错误');
  dialog.alert({
    title: '播放发生错误',
    content: e.message,
  });
  return eventemitter.emit(EventType.AUDIO_ERROR);
};

interface Props {
  playMode: PlayMode;
  queueMusic: QueueMusic;
  volume: number;
}

class Audio extends React.PureComponent<Props, {}> {
  audioRef: React.RefObject<HTMLAudioElement>;

  constructor(props: Props) {
    super(props);
    this.audioRef = React.createRef<HTMLAudioElement>();
  }

  componentDidMount() {
    this.audioRef.current!.volume = this.props.volume;

    eventemitter.on(EventType.ACTION_SET_TIME, this.onActionSetTime);
    eventemitter.on(EventType.ACTION_TOGGLE_PLAY, this.onActionTogglePlay);
    eventemitter.on(EventType.ACTION_PLAY, this.onActionPlay);
    eventemitter.on(EventType.ACTION_PAUSE, this.onActionPause);

    document.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('beforeunload', this.beforeUnload);
  }

  getSnapshotBeforeUpdate(prevProps: Props) {
    const { queueMusic } = this.props;
    if (prevProps.queueMusic.pid !== queueMusic.pid) {
      this.uploadPlayRecord(prevProps.queueMusic.music);
      this.createCache(prevProps.queueMusic.music);
    }
    return null;
  }

  componentDidUpdate(prevProps: Props) {
    const { volume, queueMusic } = this.props;

    if (prevProps.volume !== volume) {
      this.audioRef.current!.volume = volume;
    }

    if (prevProps.queueMusic.pid !== queueMusic.pid) {
      this.audioRef.current!.currentTime = 0;
      this.audioRef.current!.play();
      eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: 0,
      });
    }
  }

  componentWillUnmount() {
    eventemitter.off(EventType.ACTION_SET_TIME, this.onActionSetTime);
    eventemitter.off(EventType.ACTION_TOGGLE_PLAY, this.onActionTogglePlay);
    eventemitter.off(EventType.ACTION_PLAY, this.onActionPlay);
    eventemitter.off(EventType.ACTION_PAUSE, this.onActionPause);

    document.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('beforeunload', this.beforeUnload);

    this.uploadPlayRecord(this.props.queueMusic.music);
  }

  onActionSetTime = ({ second }: { second: number }) => {
    onWaiting();
    return window.setTimeout(() => {
      this.audioRef.current!.currentTime = second;
      this.audioRef
        .current!.play()
        .catch((error) => logger.error(error, '音频播放失败'));
      eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: second * 1000,
      });
    }, 0);
  };

  onKeyDown = keyboardHandlerWrapper((event: KeyboardEvent) => {
    const { key } = event;
    // eslint-disable-next-line default-case
    switch (key) {
      case ' ': {
        event.preventDefault();
        this.onActionTogglePlay();
        break;
      }
      case 'ArrowLeft': {
        this.audioRef.current!.currentTime -= JUMP_STEP;
        break;
      }
      case 'ArrowRight': {
        this.audioRef.current!.currentTime += JUMP_STEP;
        break;
      }
    }
  });

  onActionTogglePlay = () =>
    this.audioRef.current!.paused
      ? this.audioRef
          .current!.play()
          .catch((error) => logger.error(error, '音频播放失败'))
      : this.audioRef.current!.pause();

  onActionPlay = () =>
    this.audioRef
      .current!.play()
      .catch((error) => logger.error(error, '音频播放失败'));

  onActionPause = () => this.audioRef.current!.pause();

  onTimeUpdate = throttle(() => {
    const { currentTime } = this.audioRef.current!;
    return eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
      currentMillisecond: currentTime * 1000,
    });
  }, 300);

  getAudioSrc = (music: Music) => {
    const { playMode } = this.props;

    switch (playMode) {
      case PlayMode.HQ: {
        return music.hq;
      }
      case PlayMode.AC: {
        return music.ac;
      }
      default: {
        return music.sq;
      }
    }
  };

  getPlayedSeconeds = () => {
    const { played } = this.audioRef.current!;
    let playedSeconeds = 0;
    for (let i = 0, { length } = played; i < length; i += 1) {
      const start = played.start(i);
      const end = played.end(i);
      playedSeconeds += end - start;
    }
    return playedSeconeds;
  };

  uploadPlayRecord = (music: Music) => {
    const { duration } = this.audioRef.current!;
    const playedSeconds = this.getPlayedSeconeds();
    return uploadMusicPlayRecord({
      musicId: music.id,
      percent: duration ? playedSeconds / duration : 0,
    });
  };

  beforeUnload = () => this.uploadPlayRecord(this.props.queueMusic.music);

  /**
   * workbox 不支持缓存媒体
   * 需要手动进行缓存
   * 详情查看 https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video
   * @author mebtte<hi@mebtte.com>
   */
  createCache(music: Music) {
    const { duration } = this.audioRef.current!;
    const playedSeconds = this.getPlayedSeconeds();
    const percent = duration ? playedSeconds / duration : 0;

    /**
     * 播放超过 80% 才进行缓存
     * @author mebtte<hi@mebtte.com>
     */
    if (process.env.NODE_ENV === 'development' || percent > 0.75) {
      window.caches.open(CacheName.ASSET_MEDIA).then(async (cache) => {
        const url = this.getAudioSrc(music);
        const exist = await cache.match(url);
        if (!exist) {
          cache.add(url);
        }
      });
    }
  }

  render() {
    const { pid, music } = this.props.queueMusic;
    const audioSrc = this.getAudioSrc(music);
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <audio
        key={pid}
        ref={this.audioRef}
        style={style}
        src={audioSrc}
        autoPlay
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onWaiting={onWaiting}
        onCanPlayThrough={onCanPlayThrough}
        onTimeUpdate={this.onTimeUpdate}
        onError={onError}
        crossOrigin="anonymous"
      />
    );
  }
}

export default volumeState.withState('volume', Audio);
