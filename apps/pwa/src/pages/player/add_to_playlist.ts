import { MusicWithSingerAliases } from './constants';
import eventemitter, { EventType } from './eventemitter';

function getElementCenter(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export default function addMusicListToPlaylist(
  musicList: MusicWithSingerAliases[],
  sourceElement?: HTMLElement | null,
) {
  eventemitter.emit(EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST, {
    musicList,
    animationSource: sourceElement
      ? getElementCenter(sourceElement)
      : undefined,
  });
}
