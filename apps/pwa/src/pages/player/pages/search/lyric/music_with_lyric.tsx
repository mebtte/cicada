import styled from 'styled-components';
import { Lrc } from 'react-lrc';
import { memo } from 'react';
import { CSSVariable } from '@/global_style';
import xss from 'xss';
import Music from '../../../components/music';
import { MusicWithLyric as MusicWithLyricType } from './constants';

const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
const StyledLrc = styled(Lrc)`
  padding: 5px 0 10px 0;

  border-top: 1px solid ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
`;
const Line = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  .highlight {
    color: ${CSSVariable.COLOR_PRIMARY};
  }
`;

function MusicWithLyric({
  active,
  music,
  keyword,
}: {
  active: boolean;
  music: MusicWithLyricType;
  keyword: string;
}) {
  const replacement = new RegExp(escapeRegex(keyword), 'i');
  return (
    <Music
      active={active}
      index={music.index}
      music={music}
      addon={
        <StyledLrc
          className="lrc"
          lrc={music.lrc}
          // eslint-disable-next-line react/no-unstable-nested-components
          lineRenderer={({ line: { id, content } }) => (
            <Line
              key={id}
              dangerouslySetInnerHTML={{
                __html: xss(
                  content.replace(
                    replacement,
                    `<span class="highlight">$&</span>`,
                  ),
                  {
                    whiteList: {
                      span: ['class'],
                    },
                  },
                ),
              }}
            />
          )}
        />
      }
    />
  );
}

export default memo(MusicWithLyric);
