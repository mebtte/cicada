import { MusicWithArtistAliases } from './constants';
import eventemitter, { EventType } from './eventemitter';

export default function addMusicListToPlaylist(
  musicList: MusicWithArtistAliases[],
) {
  eventemitter.emit(EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST, {
    musicList,
  });
}
