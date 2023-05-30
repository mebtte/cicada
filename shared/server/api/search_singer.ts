type SearchSinger = {
  total: number;
  singerList: {
    id: string;
    avatar: string;
    name: string;
    aliases: string[];
    musicCount: number;
  }[];
};

export default SearchSinger;
