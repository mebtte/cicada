import { MusicWithIndex } from '../../constants';

function filterMusic(keyword: string) {
  return (listMusic: MusicWithIndex) => {
    const { name, aliases, singers } = listMusic;
    if (
      name.toLowerCase().indexOf(keyword) > -1 ||
      aliases.find((alias) => alias.toLowerCase().includes(keyword))
    ) {
      return true;
    }
    for (const singer of singers) {
      const { name: singerName, aliases: singerAliases } = singer;
      if (
        singerName.toLowerCase().indexOf(keyword) > -1 ||
        singerAliases.find((alias) => alias.toLowerCase().includes(keyword))
      ) {
        return true;
      }
    }
    return false;
  };
}

export default (musicList: MusicWithIndex[], keyword) =>
  musicList.filter(filterMusic(keyword));
