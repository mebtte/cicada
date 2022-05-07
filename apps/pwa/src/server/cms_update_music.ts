import api from '.';

export enum Key {
  COVER = 'cover',
  NAME = 'name',
  TYPE = 'type',
  ALIAS = 'alias',
  LRC = 'lrc',
  SINGER = 'singer',
  SQ = 'sq',
  HQ = 'hq',
  AC = 'ac',
  MV_LINK = 'mv_link',
  FORK_FROM = 'fork_from',
  RECOMMENDABLE = 'recommendable',
}

/**
 * CMS 更新音乐
 * @author mebtte<hi@mebtte.com>
 */
function cmsUpdateMusic({
  id,
  key,
  value,
}: {
  id: string;
  key: Key;
  value: string | File;
}) {
  const form = new FormData();
  form.append('id', id);
  form.append('key', key);
  form.append('value', value);
  return api.post('/api/cms/update_music', {
    data: form,
    withToken: true,
    timeout: 1000 * 60 * 3,
  });
}

export default cmsUpdateMusic;
