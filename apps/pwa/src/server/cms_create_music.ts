import api from '.';
import { MusicType } from '../constants/music';

/**
 * CMS 创建音乐
 * @author mebtte<hi@mebtte.com>
 */
function cmsCreateMusic({
  singerIdList,
  name,
  type,
  sq,
  recommendable,
}: {
  singerIdList: string[];
  name: string;
  type: MusicType;
  sq: File;
  recommendable: boolean;
}) {
  const form = new FormData();
  form.append('singer_ids', singerIdList.join(','));
  form.append('name', name);
  form.append('type', type.toString());
  form.append('sq', sq);
  form.append('recommendable', (recommendable ? 1 : 0).toString());
  return api.post('/api/cms/create_music', {
    data: form,
    withToken: true,
    timeout: 1000 * 60 * 3,
  });
}

export default cmsCreateMusic;
