import api from '.';

function uploadMusic({ music, name, singerIdList, type }) {
  const form = new FormData();
  form.append('music', music);
  form.append('name', name);
  form.append('singer_ids', singerIdList.join(','));
  form.append('type', type);
  return api.post('/api/music', {
    data: form,
    withToken: true,
  });
}

export default uploadMusic;
