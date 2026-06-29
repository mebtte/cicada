import { saveAs } from 'file-saver';
import formatMusicFilename from '@/utils/format_music_filename';
import { getMusicAssetOriginalExtension } from '@/utils/music_asset';
import { Music } from './constants';

export default function downloadOriginalMusicFile(
  music: Pick<Music, 'asset' | 'name' | 'performers'>,
) {
  // 原文件下载必须使用未附带 quality 参数的 asset, 避免走播放转码链路。
  saveAs(
    music.asset,
    formatMusicFilename({
      name: music.name,
      performerNames: music.performers.map((s) => s.name),
      ext: getMusicAssetOriginalExtension(music.asset),
    }),
  );
}
