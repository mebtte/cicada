import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildServerURL,
  normalizeServerBaseURL,
  ServerURLValidationError,
} from '../src/utils/server_url.js';

test('server addresses preserve the entire mount path and normalize the final slash', () => {
  assert.equal(normalizeServerBaseURL(' https://EXAMPLE.com:443/ '), 'https://example.com');
  assert.equal(normalizeServerBaseURL('https://example.com/cicada/'), 'https://example.com/cicada');
  assert.equal(normalizeServerBaseURL('http://localhost:8000/apps/music'), 'http://localhost:8000/apps/music');
  assert.equal(normalizeServerBaseURL('http://[::1]:8000/cicada/'), 'http://[::1]:8000/cicada');
  assert.equal(normalizeServerBaseURL('https://example.com/music-v2/cicada_1.0~beta'), 'https://example.com/music-v2/cicada_1.0~beta');
  assert.notEqual(normalizeServerBaseURL('https://example.com/a'), normalizeServerBaseURL('https://example.com/b'));
});

test('invalid server addresses cannot silently change their deployment path', () => {
  for (const input of [
    '',
    'example.com/cicada',
    'https:example.com/cicada',
    'https:///example.com/cicada',
    'ftp://example.com/cicada',
    'https://user:password@example.com/cicada',
    'https://@example.com/cicada',
    'https://example.com/cicada?x=1',
    'https://example.com/cicada?',
    'https://example.com/cicada#/',
    'https://example.com/cicada#',
    'https://example.com/a/../cicada',
    'https://example.com/a/./cicada',
    'https://example.com/a/%2e%2e/cicada',
    'https://example.com/%63icada',
    'https://example.com/a%2fb',
    'https://example.com/cicada//',
    'https://example.com//cicada',
    'https://example.com/a\\cicada',
    'https://example.com/a b',
    'https://example.com/a\nb',
  ]) {
    assert.throws(() => normalizeServerBaseURL(input), ServerURLValidationError, input);
  }
});

test('server URL joining retains API and asset mount paths', () => {
  assert.equal(buildServerURL('https://example.com/cicada', '/api/base/metadata'), 'https://example.com/cicada/api/base/metadata');
  assert.equal(buildServerURL('https://example.com/apps/music/', 'api/common/profile?x=1'), 'https://example.com/apps/music/api/common/profile?x=1');
  assert.equal(buildServerURL('https://example.com', '/asset/music/song.mp3?quality=source'), 'https://example.com/asset/music/song.mp3?quality=source');
  assert.equal(buildServerURL('https://remote.example/server', '/asset/music/song.mp3'), 'https://remote.example/server/asset/music/song.mp3');
});

test('server URL joining preserves absolute assets and empty placeholders', () => {
  for (const url of [
    '',
    'https://cdn.example/music.mp3',
    'http://cdn.example/music.mp3',
    '//cdn.example/music.mp3',
    'data:image/png;base64,aGVsbG8=',
    'blob:https://example.com/uuid',
  ]) {
    assert.equal(buildServerURL('https://example.com/cicada', url), url);
  }
  assert.equal(buildServerURL(undefined, '/asset/music/song.mp3'), '/asset/music/song.mp3');
});
