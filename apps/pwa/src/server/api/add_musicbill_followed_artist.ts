import { Method, request } from '..';

function addMusicbillFollowedArtist({
  musicbillId,
  artistId,
}: {
  musicbillId: string;
  artistId: string;
}) {
  return request({
    path: '/api/musicbill/followed_artist',
    method: Method.POST,
    withToken: true,
    body: { musicbillId, artistId },
  });
}

export default addMusicbillFollowedArtist;
