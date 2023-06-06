import { SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/music';
import logger from '@/utils/logger';
import { Query } from '@/constants';
import searchMusicByLyric from '@/server/api/search_music_by_lyric';
import useQuery from '@/utils/use_query';
import { useCallback, useEffect, useState } from 'react';
import { parse, LineType, LyricLine } from 'clrc';
import { MusicWithLyric, PAGE_SIZE } from './constants';

type Data = {
  error: Error | null;
  loading: boolean;
  value: {
    keyword;
    total: number;
    musicList: MusicWithLyric[];
  } | null;
};
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};
const lyricLineToRaw = (line: LyricLine) => {
  const minute = Math.floor(line.startMillisecond / 1000 / 60);
  const second = Math.floor(line.startMillisecond / 1000) % 60;
  const millisecond = line.startMillisecond % 1000;
  return `[${minute.toString().padStart(2, '0')}:${second
    .toString()
    .padStart(2, '0')}.${millisecond.toString().padStart(3, '0')}]${
    line.content
  }`;
};

export default () => {
  const { keyword = '', page } = useQuery<Query.KEYWORD | Query.PAGE>();
  const pageNumber = (page ? Number(page) : 1) || 1;
  const [data, setData] = useState(dataLoading);
  const getData = useCallback(async () => {
    if (!keyword) {
      return setData({
        error: new Error('请输入关键词进行歌词搜索'),
        loading: false,
        value: null,
      });
    }

    setData(dataLoading);
    try {
      const d = await searchMusicByLyric({
        keyword: keyword
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, SEARCH_KEYWORD_MAX_LENGTH),
        page: pageNumber,
        pageSize: PAGE_SIZE,
      });
      setData({
        error: null,
        loading: false,
        value: {
          keyword,
          total: d.total,
          musicList: d.musicList.map((music, index) => {
            let lrc = '';
            const lowerCaseKeyword = keyword.toLowerCase();
            for (const lyric of music.lyrics) {
              const lyricLines = (
                parse(lyric.lrc).filter(
                  (l) => l.type === LineType.LYRIC,
                ) as LyricLine[]
              ).sort((a, b) => a.startMillisecond - b.startMillisecond);
              for (let i = 0; i < lyricLines.length; i += 1) {
                const lyricLine = lyricLines[i];
                if (
                  lyricLine.content.toLowerCase().includes(lowerCaseKeyword)
                ) {
                  const lines: LyricLine[] = [lyricLine];
                  if (i > 0) {
                    lines.unshift(lyricLines[i - 1]);
                  }
                  if (i > 1) {
                    lines.unshift(lyricLines[i - 2]);
                  }
                  if (i < lyricLines.length - 2) {
                    lines.push(lyricLines[i + 2]);
                  }
                  if (i < lyricLines.length - 1) {
                    lines.push(lyricLines[i + 1]);
                  }
                  lrc = lines.map((line) => lyricLineToRaw(line)).join('\n');
                  break;
                }
              }
            }

            return {
              ...music,
              index: d.total - index - (pageNumber - 1) * PAGE_SIZE,
              lrc,
            };
          }),
        },
      });
    } catch (error) {
      logger.error(error, '通过歌词搜索音乐失败');
      setData({
        error,
        loading: false,
        value: null,
      });
    }
  }, [keyword, pageNumber]);

  useEffect(() => {
    getData();
  }, [getData]);

  return { data, reload: getData, page: pageNumber };
};
