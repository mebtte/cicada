import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import AudioPlaybackIntent from '../src/utils/audio_playback_intent.js';

test('source loading pause keeps the pending playback request', () => {
  const intent = new AudioPlaybackIntent();

  intent.requestPlay();
  intent.startSourceLoading();
  intent.handleNativePause();

  assert.equal(intent.isPlaybackRequested(), true);
});

test('an explicit pause cancels playback while a source is loading', () => {
  const intent = new AudioPlaybackIntent();

  intent.requestPlay();
  intent.startSourceLoading();
  intent.requestPause();
  intent.handleNativePause();

  assert.equal(intent.isPlaybackRequested(), false);
});

test('a native pause after loading cancels the playback request', () => {
  const intent = new AudioPlaybackIntent();

  intent.requestPlay();
  intent.startSourceLoading();
  intent.finishSourceLoading();
  intent.handleNativePause();

  assert.equal(intent.isPlaybackRequested(), false);
});

test('radio media session follows the preserved playback request', () => {
  const source = readFileSync(
    new URL(
      '../../src/pages/radio/use_radio_media_session.ts',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(source, /audio\.isPlaybackRequested\(\)/);
});
