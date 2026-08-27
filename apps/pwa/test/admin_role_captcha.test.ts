import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const userEditSources = [
  '../../src/pages/admin/components/user_edit/content.tsx',
  '../../src/pages/player/pages/user_manage/user_edit_drawer/user_edit.tsx',
];

test('all user management entries require captcha for admin role changes', () => {
  for (const relativePath of userEditSources) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');

    assert.match(source, /dialog\.captcha\(\{/);
    assert.match(
      source,
      /onConfirm:\s*\(\{ captchaId, captchaValue \}\)\s*=>\s*updateAdmin\(nextAdmin, captchaId, captchaValue\)/,
    );
    assert.match(
      source,
      /adminUpdateUserAdmin\(\{[\s\S]*?id: user\.id,[\s\S]*?admin: nextAdmin,[\s\S]*?captchaId,[\s\S]*?captchaValue,[\s\S]*?\}\)/,
    );
  }
});

test('admin role API requires captcha at compile time', () => {
  const source = readFileSync(
    new URL(
      '../../src/server/api/admin_update_user_admin.ts',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(source, /captchaId: string;\s*captchaValue: string;/);
  assert.doesNotMatch(source, /captcha(?:Id|Value)\?: string/);
});
