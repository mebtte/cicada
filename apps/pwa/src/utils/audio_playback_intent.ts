/**
 * Tracks whether playback is still expected while an audio source is changing.
 * Browsers may emit a temporary `pause` for the old source before the new one
 * becomes playable; that event must not be treated as an explicit pause.
 */
class AudioPlaybackIntent {
  private playbackRequested = false;
  private sourceLoading = false;

  requestPlay() {
    this.playbackRequested = true;
  }

  requestPause() {
    this.playbackRequested = false;
  }

  startSourceLoading() {
    this.sourceLoading = true;
  }

  finishSourceLoading() {
    this.sourceLoading = false;
  }

  handleNativePause() {
    if (!this.sourceLoading) {
      this.playbackRequested = false;
    }
  }

  reset() {
    this.playbackRequested = false;
    this.sourceLoading = false;
  }

  isPlaybackRequested() {
    return this.playbackRequested;
  }
}

export default AudioPlaybackIntent;
