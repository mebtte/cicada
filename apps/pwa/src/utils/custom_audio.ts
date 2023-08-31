class CustomAudio<Extra> {
  readonly extra: Extra;

  private audio: HTMLAudioElement;

  constructor({ src, extra }: { src: string; extra: Extra }) {
    const audio = new window.Audio();
    audio.crossOrigin = 'anonymous';
    audio.autoplay = true;
    audio.preload = 'auto';
    audio.loop = false;
    audio.src = src;

    this.audio = audio;
    this.extra = extra;
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

  setVolume(volume: number) {
    this.audio.volume = volume;
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
    return this.audio.play();
  }

  pause() {
    return this.audio.pause();
  }

  isPaused() {
    return this.audio.paused;
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
    return duration ? buffered.end(buffered.length - 1) / duration : 0;
  }
}

export default CustomAudio;
