import { Response } from '#/server/api/get_self_musicbill_list';
import { AssetType, MusicbillSharedStatus } from '#/constants';
import { getAssetPublicPath } from '@/platform/asset';
import {
  MUSICBILL_TABLE_NAME,
  Musicbill,
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbillProperty,
} from '@/constants/db_definition';
import { getDB } from '@/db';
import excludeProperty from '#/utils/exclude_property';
import { Context } from '../constants';

const MUSICBILL_PROPERTIES = [
  MusicbillProperty.ID,
  MusicbillProperty.COVER,
  MusicbillProperty.NAME,
  MusicbillProperty.PUBLIC,
  MusicbillProperty.CREATE_TIMESTAMP,
];
type LocalMusicbill = Pick<
  Musicbill,
  | MusicbillProperty.ID
  | MusicbillProperty.COVER
  | MusicbillProperty.NAME
  | MusicbillProperty.PUBLIC
  | MusicbillProperty.CREATE_TIMESTAMP
>;

export default async (ctx: Context) => {
  const [musicbillList, sharedToMeMusicbillList] = await Promise.all([
    getDB().all<
      LocalMusicbill & {
        shareToUsers: number;
      }
    >(
      `
        SELECT
          ${MUSICBILL_PROPERTIES.map((p) => `mb.${p}`).join(', ')},
          count(smb.${SharedMusicbillProperty.ID}) AS shareToUsers
        FROM ${MUSICBILL_TABLE_NAME} AS mb
        LEFT JOIN ${SHARED_MUSICBILL_TABLE_NAME} AS smb
          ON mb.${MusicbillProperty.ID} = smb.${
        SharedMusicbillProperty.MUSICBILL_ID
      }
        WHERE mb.${MusicbillProperty.USER_ID} = ?
        GROUP BY mb.${MusicbillProperty.ID}
      `,
      [ctx.user.id],
    ),
    getDB().all<LocalMusicbill>(
      `
        SELECT
          ${MUSICBILL_PROPERTIES.map((p) => `mb.${p}`).join(', ')}
        FROM ${SHARED_MUSICBILL_TABLE_NAME} AS smb
        LEFT JOIN ${MUSICBILL_TABLE_NAME} AS mb
          ON smb.${SharedMusicbillProperty.MUSICBILL_ID} = mb.${
        MusicbillProperty.ID
      }
        WHERE smb.${SharedMusicbillProperty.ACCEPTED} = 1
          AND smb.${SharedMusicbillProperty.SHARED_USER_ID} = ?
      `,
      [ctx.user.id],
    ),
  ]);

  return ctx.success<Response>(
    [
      ...musicbillList.map((mb) => ({
        ...excludeProperty(mb, ['shareToUsers']),
        shareStatus:
          mb.shareToUsers > 0
            ? MusicbillSharedStatus.SHARE_TO_OTHERS
            : MusicbillSharedStatus.NOT_SHARE,
      })),
      ...sharedToMeMusicbillList.map((mb) => ({
        ...mb,
        shareStatus: MusicbillSharedStatus.SHARE_TO_ME,
      })),
    ].map((mb) => ({
      ...mb,
      cover: getAssetPublicPath(mb.cover, AssetType.MUSICBILL_COVER),
    })),
  );
};
