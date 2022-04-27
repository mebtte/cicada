import React, { useMemo } from 'react';
import styled from 'styled-components';
import { parse } from 'react-lrc';
import dompurify from 'dompurify';

import ellipsis from '@/style/ellipsis';
import Music from '../../../components/music';
import { MusicWithIndexAndLrc } from '../constants';

const Style = styled.div`
  padding: 12px 20px;
  &:hover {
    background-color: #f9f9f9;
  }
  > .lyric {
    padding-left: 50px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-color-primary);
    ${ellipsis}
    > .line {
      margin-right: 10px;
      &:last-child,
      &:empty {
        margin-right: 0;
      }
      > .highlight {
        color: var(--color-primary);
      }
    }
  }
`;
const musicStyle = {
  height: 'auto',
  padding: 0,
  backgroundColor: 'transparent',
};
const replaceIgnoreCase = (
  original: string,
  searchValue: string,
  handler: (match: string) => string,
) => {
  const start = original.toLowerCase().indexOf(searchValue.toLowerCase());
  if (start >= original.length) {
    return original;
  }
  const end = start + searchValue.length;
  const match = original.slice(start, end);
  return original.slice(0, start) + handler(match) + original.slice(end);
};

const Wrapper = ({
  keyword,
  music,
}: {
  keyword: string;
  music: MusicWithIndexAndLrc;
}) => {
  const {
    music: { lrc },
  } = music;
  const lrcNode = useMemo(() => {
    const { lyrics } = parse(lrc, { trimStart: true, trimEnd: true });
    const notEmptyLyrics = lyrics.filter((l) => !!l.content);

    const lowerCaseKeyword = keyword.toLowerCase();
    const matchIndex = notEmptyLyrics.findIndex((l) =>
      l.content.toLowerCase().includes(lowerCaseKeyword),
    );
    const start = matchIndex - 1 < 0 ? 0 : matchIndex - 1;
    const end =
      matchIndex + 1 >= notEmptyLyrics.length
        ? notEmptyLyrics.length
        : matchIndex + 1;
    const matchLyrics = notEmptyLyrics.slice(start, end + 1);
    return (
      <div
        className="lyric"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: dompurify.sanitize(
            matchLyrics
              .map(
                (l) =>
                  `<span class="line">${replaceIgnoreCase(
                    l.content,
                    keyword,
                    (match) =>
                      match ? `<span class="highlight">${match}</span>` : '',
                  )}</span>`,
              )
              .join(''),
          ),
        }}
      />
    );
  }, [lrc, keyword]);
  return (
    <Style>
      <Music musicWithIndex={music} style={musicStyle} />
      {lrcNode}
    </Style>
  );
};

export default Wrapper;
