import { Method, request } from '..';

function removeMusicbillFollowedArtist({
  musicbillId,
  artistId,
}: {
  musicbillId: string;
  artistId: string;
}) {
  return request({
    path: '/api/common/musicbill/followed_artist',
    method: Method.DELETE,
    withToken: true,
    params: { musicbillId, artistId },
  });
}

export default removeMusicbillFollowedArtist;
