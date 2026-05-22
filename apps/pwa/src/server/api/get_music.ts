import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

interface SingerPhoto {
  id: string;
  asset: string;
  description: string;
}

interface Singer {
  id: string;
  name: string;
  photos?: SingerPhoto[];
}

interface Music {
  id: string;
  cover: string;
  name: string;
  singers: Singer[];
}

type Response = Omit<Music, 'singers'> & {
  type: MusicType;
  aliases: string[];
  heat: number;
  createTimestamp: number;
  forkList: Music[];
  forkFromList: Music[];
  year: number | null;
  asset: string;
  assetSize: number;
  assetDurationMs: number;
  assetCodec: string;
  assetBitRate: number;
  musicbillCount: number;
  relatedPublicMusicbillList?: {
    id: string;
    name: string;
    cover: string;
    musicCount: number;
    user: {
      id: string;
      nickname: string;
      avatar: string;
    };
  }[];
  singers: (Singer & {
    aliases: string[];
  })[];
};

const normalizePhotos = (photos: SingerPhoto[] = []) =>
  photos.map((p) => ({
    ...p,
    asset: prefixServerOrigin(p.asset),
  }));

/**
 * 获取音乐详情
 * @author mebtte<i@mebtte.com>
 */
async function getMusic({
  id,
  requestMinimalDuration,
}: {
  id: string;
  requestMinimalDuration?: number;
}) {
  const music = await request<Response>({
    path: '/api/music',
    params: { id },
    withToken: true,
    requestMinimalDuration,
  });
  return {
    ...music,
    cover: prefixServerOrigin(music.cover),
    asset: prefixServerOrigin(music.asset),
    singers: music.singers.map((s) => {
      const photos = normalizePhotos(s.photos);
      return {
        ...s,
        photos,
        avatar: photos[0]?.asset ?? '',
      };
    }),
    forkList: music.forkList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      singers: m.singers.map((s) => ({
        ...s,
        photos: normalizePhotos(s.photos),
      })),
    })),
    forkFromList: music.forkFromList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      singers: m.singers.map((s) => ({
        ...s,
        photos: normalizePhotos(s.photos),
      })),
    })),
    relatedPublicMusicbillList: (
      music.relatedPublicMusicbillList ?? []
    ).map((mb) => ({
      ...mb,
      cover: prefixServerOrigin(mb.cover),
      user: {
        ...mb.user,
        avatar: prefixServerOrigin(mb.user.avatar),
      },
    })),
  };
}

export default getMusic;
