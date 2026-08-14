import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('create artist request failures are shown in an alert dialog', () => {
  const source = readFileSync(
    new URL(
      '../../src/pages/admin/open_create_artist_dialog.ts',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(
    source,
    /dialog\.alert\(\{\s*content:\s*error\.message\s*\}\)/,
  );
  assert.doesNotMatch(source, /notice\.error\(error\.message\)/);
});
