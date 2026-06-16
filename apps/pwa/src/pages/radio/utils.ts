import { MusicWithArtistAliases, QueueMusic } from '@/features/player/constants';

/**
 * 电台模式没有真实的播放列表概念, 但要复用主播放器的 `QueueMusic` 类型
 * (以便能直接喂给 `usePlayRecord` 和现有的弹屉组件). 用一个自增计数生成
 * 唯一的 pid 保证同首歌作为新队列项播放时被识别成新的会话.
 */
export function toRadioQueueMusic(
  music: MusicWithArtistAliases,
  sequence: number,
): QueueMusic {
  return {
    id: music.id,
    cover: music.cover,
    coverThumbnail: music.coverThumbnail,
    name: music.name,
    type: music.type,
    aliases: music.aliases,
    asset: music.asset,
    performers: music.performers,
    lyricists: music.lyricists,
    composers: music.composers,
    index: sequence,
    pid: `radio-${music.id}-${sequence}`,
    shuffle: true,
  };
}
