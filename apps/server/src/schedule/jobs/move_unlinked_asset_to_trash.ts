import fs from 'fs/promises';
import withTimeout from '#/utils/with_timeout';
import { AssetType } from '#/constants';
import { getDB } from '@/db';
import day from '#/utils/day';
import mv from '#/utils/mv';
import { getAssetFilePath } from '@/platform/asset';
import { getAssetDirectory, getTrashDirectory } from '@/config';

const findUnlinkedList = (linkedList: string[], all: string[]) =>
  all.filter((item) => !linkedList.includes(item));
const moveAssetListToTrash = async (
  assetList: string[],
  assetType: AssetType,
) => {
  for (const asset of assetList) {
    await mv(
      getAssetFilePath(asset, assetType),
      `${getTrashDirectory()}/${asset}`,
    );
  }
};
const ASSET_TYPE_MAP_HANDLER: Record<AssetType, () => Promise<void>> = {
  [AssetType.USER_AVATAR]: async () => {
    const userList = await getDB().all<{ avatar: string }>(
      `
        SELECT DISTINCT avatar FROM user
        WHERE avatar != ''
      `,
      [],
    );
    const avatarAssetList = await fs.readdir(
      getAssetDirectory(AssetType.USER_AVATAR),
    );
    const unlinkedList = findUnlinkedList(
      userList.map((u) => u.avatar),
      avatarAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetType.USER_AVATAR),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_user_avatar_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
  [AssetType.MUSICBILL_COVER]: async () => {
    const musicbillList = await getDB().all<{ cover: string }>(
      `
        SELECT DISTINCT cover FROM musicbill
        WHERE cover != ''
      `,
      [],
    );
    const coverAssetList = await fs.readdir(
      getAssetDirectory(AssetType.MUSICBILL_COVER),
    );
    const unlinkedList = findUnlinkedList(
      musicbillList.map((m) => m.cover),
      coverAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetType.MUSICBILL_COVER),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_musicbill_cover_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
  [AssetType.SINGER_AVATAR]: async () => {
    const singerList = await getDB().all<{ avatar: string }>(
      `
        SELECT DISTINCT avatar FROM singer
        WHERE avatar != '';
      `,
      [],
    );
    const avatarAssetList = await fs.readdir(
      getAssetDirectory(AssetType.SINGER_AVATAR),
    );
    const unlinkedList = findUnlinkedList(
      singerList.map((s) => s.avatar),
      avatarAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetType.SINGER_AVATAR),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_singer_avatar_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },

  [AssetType.MUSIC_COVER]: async () => {
    const musicList = await getDB().all<{ cover: string }>(
      `
        SELECT DISTINCT cover FROM music
        WHERE cover != '';
      `,
      [],
    );
    const coverAssetList = await fs.readdir(
      getAssetDirectory(AssetType.MUSIC_COVER),
    );
    const unlinkedList = findUnlinkedList(
      musicList.map((m) => m.cover),
      coverAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetType.MUSIC_COVER),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_music_cover_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
  [AssetType.MUSIC_SQ]: async () => {
    const musicList = await getDB().all<{ sq: string }>(
      `
        SELECT DISTINCT sq FROM music
      `,
      [],
    );
    const sqAssetList = await fs.readdir(getAssetDirectory(AssetType.MUSIC_SQ));
    const unlinkedList = findUnlinkedList(
      musicList.map((m) => m.sq),
      sqAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetType.MUSIC_SQ),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_music_sq_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
  [AssetType.MUSIC_HQ]: async () => {
    const musicList = await getDB().all<{ hq: string }>(
      `
        SELECT DISTINCT hq FROM music
        WHERE hq != ''
      `,
      [],
    );
    const hqAssetList = await fs.readdir(getAssetDirectory(AssetType.MUSIC_HQ));
    const unlinkedList = findUnlinkedList(
      musicList.map((m) => m.hq),
      hqAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetType.MUSIC_HQ),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_music_hq_asset_${day().format(
            'YYYYMMDD',
          )}.json`,
          JSON.stringify(unlinkedList),
        ),
      ]);
    }
  },
  [AssetType.MUSIC_AC]: async () => {
    const musicList = await getDB().all<{ ac: string }>(
      `
        SELECT DISTINCT ac FROM music
        WHERE ac != ''
      `,
      [],
    );
    const acAssetList = await fs.readdir(getAssetDirectory(AssetType.MUSIC_AC));
    const unlinkedList = findUnlinkedList(
      musicList.map((m) => m.ac),
      acAssetList,
    );

    if (unlinkedList.length) {
      await Promise.all([
        moveAssetListToTrash(unlinkedList, AssetType.MUSIC_AC),
        fs.writeFile(
          `${getTrashDirectory()}/unlinked_music_ac_asset_${day().format(
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
