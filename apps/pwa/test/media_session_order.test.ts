import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mediaSessionSources = [
  '../../src/pages/player/use_media_session.ts',
  '../../src/pages/radio/use_radio_media_session.ts',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

test('track metadata is committed before passive audio source effects', () => {
  mediaSessionSources.forEach((source) => {
    const metadataEffect = source.match(
      /use(Layout)?Effect\(\(\) => \{(?:(?!use(?:Layout)?Effect)[\s\S])*?new MediaMetadata/,
    );

    assert.ok(metadataEffect, 'expected to find the media metadata effect');
    assert.equal(
      metadataEffect[1],
      'Layout',
      'metadata must use a layout effect so iOS never observes the new source with stale metadata',
    );
  });
});
