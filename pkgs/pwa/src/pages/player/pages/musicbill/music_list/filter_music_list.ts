import { MusicWithIndex } from '../../../constants';

function filterMusic(keyword: string) {
  return (listMusic: MusicWithIndex) => {
    const { name, alias, singers } = listMusic.music;
    if (
      name.toLowerCase().indexOf(keyword) > -1 ||
      alias.toLowerCase().indexOf(keyword) > -1
    ) {
      return true;
    }
    for (const singer of singers) {
      const { name: singerName, alias: singerAlias } = singer;
      if (
        singerName.toLowerCase().indexOf(keyword) > -1 ||
        singerAlias.toLowerCase().indexOf(keyword) > -1
      ) {
        return true;
      }
    }
    return false;
  };
}

export default (musicList: MusicWithIndex[], keyword) => {
  if (!keyword) {
    return musicList;
  }
  return musicList.filter(filterMusic(keyword));
};
