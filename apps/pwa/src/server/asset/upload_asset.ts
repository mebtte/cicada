import { AssetType } from '@/constants/asset';
import { request, Method } from '..';

function uploadAsset(asset: Blob, assetType: AssetType) {
  const form = new FormData();
  form.append('asset', asset);
  form.append('assetType', assetType);
  return request<{
    id: string;
    path: string;
  }>({
    method: Method.POST,
    path: '/api/asset',
    body: form,
    withToken: true,
    timeout: 5 * 60 * 1000,
  });
}

export default uploadAsset;
