import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('notice close button keeps the neutral ghost button icon color', () => {
  const source = readFileSync(
    new URL('../../src/utils/notice/notice_item.tsx', import.meta.url),
    'utf8',
  );
  const closeButtonRule = source.match(/> \.close \{(?<rule>[\s\S]*?)\n    \}/);

  assert.ok(closeButtonRule?.groups?.rule, 'close button style rule is missing');
  assert.doesNotMatch(closeButtonRule.groups.rule, /\bcolor\s*:/);
});
