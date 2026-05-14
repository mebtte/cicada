class CustomAudio<Extra> {
  extra: Extra | null = null;

  private readonly audio: HTMLAudioElement;

  constructor() {
    const audio = window.document.createElement('audio');
    audio.crossOrigin = 'anonymous';
    audio.autoplay = true;
    audio.preload = 'auto';
    audio.loop = false;
    audio.controls = false;
    audio.tabIndex = -1;
    audio.setAttribute('aria-hidden', 'true');
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.setAttribute('data-cicada-player-audio', 'true');
    audio.style.position = 'fixed';
    audio.style.left = '-9999px';
    audio.style.top = '0';
    audio.style.width = '1px';
    audio.style.height = '1px';
    audio.style.opacity = '0';
    audio.style.pointerEvents = 'none';

    (window.document.body || window.document.documentElement).appendChild(
      audio,
    );

    this.audio = audio;
  }

  listen(
    eventType:
      | 'abort'
      | 'encrypted'
      | 'ratechange'
      | 'volumechange'
      | 'error'
      | 'canplaythrough'
      | 'durationchange'
      | 'play'
      | 'pause'
      | 'timeupdate'
      | 'ended'
      | 'waiting'
      | 'playing'
      | 'progress'
      | 'seeking'
      | 'seeked'
      | 'loadedmetadata'
      | 'loadeddata'
      | 'canplay'
      | 'emptied'
      | 'loadstart'
      | 'loadeddata'
      | 'loadedmetadata'
      | 'stalled'
      | 'suspend',
    listener: () => void,
  ) {
    this.audio.addEventListener(eventType, listener);
    return () => this.audio.removeEventListener(eventType, listener);
  }

  /**
   * 切换音源.
   * 复用同一个 <audio> 元素以保留 iOS Safari 锁屏下的音频会话权限,
   * 否则每次新建 element 会被视为缺少用户手势, autoplay 被拒.
   * @author mebtte<i@mebtte.com>
   */
  setSource({ src, extra }: { src: string; extra: Extra }) {
    this.extra = extra;
    if (this.audio.src !== src) {
      this.audio.src = src;
    }
  }

  clearSource() {
    this.extra = null;
    this.audio.removeAttribute('src');
    this.audio.load();
  }

  getSrc() {
    return this.audio.src;
  }

  setVolume(volume: number) {
    this.audio.volume = volume;
  }

  getVolume() {
    return this.audio.volume;
  }

  getDuration() {
    return this.audio.duration;
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  setCurrentTime(ct: number) {
    this.audio.currentTime = ct;
  }

  play() {
    const p = this.audio.play();
    if (p && typeof p.then === 'function') {
      p.catch((err: DOMException) => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          throw err;
        }
      });
    }
    return p;
  }

  pause() {
    return this.audio.pause();
  }

  isPaused() {
    return this.audio.paused;
  }

  hasPlayableData() {
    return this.audio.readyState >= this.audio.HAVE_FUTURE_DATA;
  }

  getPlayedSeconds() {
    const { played } = this.audio;
    let playedSeconeds = 0;
    for (let i = 0, { length } = played; i < length; i += 1) {
      const start = played.start(i);
      const end = played.end(i);
      playedSeconeds += end - start;
    }
    return playedSeconeds;
  }

  getBufferedPercent() {
    const { duration, buffered } = this.audio;
    return duration && buffered.length
      ? buffered.end(buffered.length - 1) / duration
      : 0;
  }
}

export default CustomAudio;
