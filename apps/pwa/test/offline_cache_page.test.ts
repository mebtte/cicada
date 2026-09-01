import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(
  new URL(
    '../../src/pages/player/pages/offline_cache/index.tsx',
    import.meta.url,
  ),
  'utf8',
);

test('offline cache waits for its first async read before showing empty state', () => {
  assert.match(source, /const \[loading, setLoading\] = useState\(true\)/);
  assert.match(
    source,
    /\{loading \? \(\s*<StatusWrap>\s*<Spinner \/>\s*<\/StatusWrap>\s*\) : filteredEntries\.length === 0 \? \(/,
  );
  assert.match(source, /setLoading\(false\)/);
});

test('offline cache renders large result sets through the virtual list', () => {
  assert.match(source, /<VirtualList\s+count=\{filteredEntries\.length\}/);
  assert.match(
    source,
    /getItemKey=\{\(index\) => filteredEntries\[index\]\.id\}/,
  );
  assert.match(source, /scrollElementRef=\{scrollElementRef\}/);
  assert.doesNotMatch(source, /filteredEntries\.map\(\(entry\)/);
  assert.match(source, /listCachedMusicUrls\(\)/);
  assert.doesNotMatch(source, /isAudioAssetCached\(/);
});
