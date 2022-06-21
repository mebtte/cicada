import { MusicWithIndex } from '../../constants';

function filterMusic(keyword: string) {
  return (listMusic: MusicWithIndex) => {
    const { name, aliases, singers } = listMusic.music;
    if (
      name.toLowerCase().indexOf(keyword) > -1 ||
      aliases.toLowerCase().indexOf(keyword) > -1
    ) {
      return true;
    }
    for (const singer of singers) {
      const { name: singerName, aliases: singerAliases } = singer;
      if (
        singerName.toLowerCase().indexOf(keyword) > -1 ||
        singerAliases.toLowerCase().indexOf(keyword) > -1
      ) {
        return true;
      }
    }
    return false;
  };
}

export default (musicList: MusicWithIndex[], keyword) =>
  musicList.filter(filterMusic(keyword));
