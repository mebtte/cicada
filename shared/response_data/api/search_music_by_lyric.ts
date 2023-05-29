import { MusicType } from '../../constants/music';

type SearchMusicByLyric = {
  total: number;
  musicList: {
    id: string;
    type: MusicType;
    name: string;
    aliases: string[];
    cover: string;
    asset: string;
    singers: {
      id: string;
      name: string;
      aliases: string[];
    }[];
    lyrics: {
      id: number;
      lrc: string;
    }[];
  }[];
};

export default SearchMusicByLyric;
