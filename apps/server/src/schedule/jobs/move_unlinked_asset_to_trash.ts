import fs from 'fs/promises';
import withTimeout from '#/utils/with_timeout';
import { AssetTypeV1 } from '#/constants';
import { getDB } from '@/db';
import day from '#/utils/day';
import mv from '#/utils/mv';
import { getAssetFilePath } from '@/platform/asset';
import { getAssetDirectory, getTrashDirectory } from '@/config';
import { Music, MusicProperty } from '@/constants/db_definition';

const findUnlinkedList = (linkedList: string[], all: string[]) =>
  all.filter((item) => !linkedList.includes(item));
const moveAssetListToTrash = async (
  assetList: string[],
  assetType: AssetTypeV1,
) => {
  for (const asset of assetList) {
    await mv(
      getAssetFilePath(asset, assetType),
      `${getTrashDirectory()}/${asset}`,
    );
  }
};
const ASSET_TYPE_MAP_HANDLER: Record<AssetTypeV1, () => Promise<void>> = {
  [AssetTypeV1.USER_AVATAR]: async () => {
    const userList = await getDB().all<{ avatar: string }>(
      `
        SELECT DISTINCT avatar FROM user
        WHERE avatar != ''
      `,
      [],
    );
    const avatarAssetList = await fs.readdir(
      getAssetDirectory(AssetTypeV1.USER_AVATAR),
    );
    const unlinkedList = findUnlinkedList(
      userList.map((u) => u.avatar),
      avatarAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetTypeV1.USER_AVATAR),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_user_avatar_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
  [AssetTypeV1.MUSICBILL_COVER]: async () => {
    const musicbillList = await getDB().all<{ cover: string }>(
      `
        SELECT DISTINCT cover FROM musicbill
        WHERE cover != ''
      `,
      [],
    );
    const coverAssetList = await fs.readdir(
      getAssetDirectory(AssetTypeV1.MUSICBILL_COVER),
    );
    const unlinkedList = findUnlinkedList(
      musicbillList.map((m) => m.cover),
      coverAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetTypeV1.MUSICBILL_COVER),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_musicbill_cover_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
  [AssetTypeV1.SINGER_AVATAR]: async () => {
    const singerList = await getDB().all<{ avatar: string }>(
      `
        SELECT DISTINCT avatar FROM singer
        WHERE avatar != '';
      `,
      [],
    );
    const avatarAssetList = await fs.readdir(
      getAssetDirectory(AssetTypeV1.SINGER_AVATAR),
    );
    const unlinkedList = findUnlinkedList(
      singerList.map((s) => s.avatar),
      avatarAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetTypeV1.SINGER_AVATAR),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_singer_avatar_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },

  [AssetTypeV1.MUSIC_COVER]: async () => {
    const musicList = await getDB().all<{ cover: string }>(
      `
        SELECT DISTINCT cover FROM music
        WHERE cover != '';
      `,
      [],
    );
    const coverAssetList = await fs.readdir(
      getAssetDirectory(AssetTypeV1.MUSIC_COVER),
    );
    const unlinkedList = findUnlinkedList(
      musicList.map((m) => m.cover),
      coverAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetTypeV1.MUSIC_COVER),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_music_cover_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
  [AssetTypeV1.MUSIC]: async () => {
    const musicList = await getDB().all<Pick<Music, MusicProperty.ASSET>>(
      `
        SELECT
          DISTINCT ${MusicProperty.ASSET}
        FROM music
      `,
      [],
    );
    const musicAssetList = await fs.readdir(
      getAssetDirectory(AssetTypeV1.MUSIC),
    );
    const unlinkedList = findUnlinkedList(
      musicList.map((m) => m.asset),
      musicAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetTypeV1.MUSIC),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_music_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
};

async function moveUnlinkedAssetToTash() {
  for (const assetHandler of Object.values(ASSET_TYPE_MAP_HANDLER)) {
    await assetHandler();
  }
}

export default withTimeout(moveUnlinkedAssetToTash, 60 * 1000);
