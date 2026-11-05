import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAppBaseURL,
  getAppNamespace,
  getAppNavigationPattern,
} from '../src/utils/app_url.js';
import {
  getAssetType,
  isCommonAPIPath,
} from '../src/utils/service_worker_routes.js';
import { AssetType } from '../src/constants/asset.js';

test('page and worker derive the same app base at root and nested mounts', () => {
  for (const path of ['/', '/cicada/', '/apps/music/']) {
    const base = `https://example.com${path}`;
    assert.equal(getAppBaseURL(`${base}?lang=zh#/player`), base);
    assert.equal(getAppBaseURL(`${base}index.html#/login`), base);
    assert.equal(getAppBaseURL(`${base}service_worker.js`), base);
  }
});

test('storage and cache namespaces isolate every mount including root', () => {
  const paths = ['/', '/a/', '/b/', '/a/b/', '/a_b/'];
  const namespaces = paths.map((path) => getAppNamespace(`https://example.com${path}`));
  assert.equal(new Set(namespaces).size, paths.length);
  assert.equal(
    getAppNamespace('https://example.com/a/'),
    getAppNamespace('https://example.com/a/?lang=en'),
  );
});

test('offline app shell handles only the mounted entry with optional query', () => {
  const pattern = getAppNavigationPattern('https://example.com/apps/music.v1/');
  assert.equal(pattern.test('/apps/music.v1/'), true);
  assert.equal(pattern.test('/apps/music.v1/?lang=zh'), true);
  for (const path of ['/', '/apps/musicXv1/', '/apps/music.v1/api/common/profile', '/apps/music.v1/apidoc']) {
    assert.equal(pattern.test(path), false);
  }
});

test('worker recognizes remote assets and common APIs under arbitrary prefixes', () => {
  for (const prefix of ['', '/cicada', '/remote/music']) {
    assert.equal(getAssetType(`${prefix}/asset/music/song.flac`), AssetType.MUSIC);
    assert.equal(getAssetType(`${prefix}/asset/music_cover/cover.jpg`), AssetType.MUSIC_COVER);
    assert.equal(isCommonAPIPath(`${prefix}/api/common/profile`), true);
  }
  for (const path of ['/assets/music/song.flac', '/asset/music/', '/asset/music/song.flac/extra', '/asset/unknown/cover.jpg']) {
    assert.equal(getAssetType(path), undefined);
  }
  for (const path of ['/api/commonality/profile', '/api/base/metadata', '/api/admin/music', '/api-common/profile']) {
    assert.equal(isCommonAPIPath(path), false);
  }
});
