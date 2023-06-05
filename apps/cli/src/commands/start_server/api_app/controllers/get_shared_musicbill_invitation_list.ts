import { Response } from '#/server/api/get_shared_musicbill_invitation_list';
import { getDB } from '@/db';
import {
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbillProperty,
  USER_TABLE_NAME,
  UserProperty,
  SharedMusicbill,
  User,
  MUSICBILL_TABLE_NAME,
  MusicbillProperty,
  Musicbill,
} from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const invitations = await getDB().all<
    Pick<
      SharedMusicbill,
      | SharedMusicbillProperty.ID
      | SharedMusicbillProperty.SHARE_TIMESTAMP
      | SharedMusicbillProperty.INVITE_USER_ID
    > & {
      inviteUserNickname: User[UserProperty.NICKNAME];
      musicbillName: Musicbill[MusicbillProperty.NAME];
    }
  >(
    `
      SELECT
        smb.${SharedMusicbillProperty.ID},
        smb.${SharedMusicbillProperty.SHARE_TIMESTAMP},
        smb.${SharedMusicbillProperty.INVITE_USER_ID},
        u.${UserProperty.NICKNAME} AS inviteUserNickname,
        mb.${MusicbillProperty.NAME} AS musicbillName
      FROM ${SHARED_MUSICBILL_TABLE_NAME} AS smb
      JOIN ${USER_TABLE_NAME} AS u
        ON smb.${SharedMusicbillProperty.INVITE_USER_ID} = u.${UserProperty.ID}
      JOIN ${MUSICBILL_TABLE_NAME} AS mb
        ON smb.${SharedMusicbillProperty.MUSICBILL_ID} = mb.${MusicbillProperty.ID}
      WHERE smb.${SharedMusicbillProperty.ACCEPTED} = 0
        AND smb.${SharedMusicbillProperty.SHARED_USER_ID} = ?
      ORDER BY smb.${SharedMusicbillProperty.SHARE_TIMESTAMP} DESC
    `,
    [ctx.user.id],
  );
  return ctx.success<Response>(invitations);
};
