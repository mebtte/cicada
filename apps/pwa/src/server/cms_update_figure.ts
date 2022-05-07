import api from '.';

export enum Key {
  NAME = 'name',
  ALIAS = 'alias',
  AVATAR = 'avatar',
}

/**
 * CMS 更新角色
 * @author mebtte<hi@mebtte.com>
 */
function cmsUpdateFigure({
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
  return api.post('/api/cms/update_figure', {
    data: form,
    withToken: true,
  });
}

export default cmsUpdateFigure;
