import { MusicWithSingerAliases } from './constants';
import eventemitter, { EventType } from './eventemitter';

export default function addMusicListToPlaylist(
  musicList: MusicWithSingerAliases[],
) {
  eventemitter.emit(EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST, {
    musicList,
  });
}
