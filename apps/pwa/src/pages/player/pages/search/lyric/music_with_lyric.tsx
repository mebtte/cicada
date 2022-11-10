import styled from 'styled-components';
import mm from '@/global_states/mini_mode';
import { Lrc } from 'react-lrc';
import { memo } from 'react';
import { CSSVariable } from '#/global_style';
import xss from 'xss';
import Music from '../../../components/music';
import { MusicWithLyric as MusicWithLyricType } from './constants';

const StyledMusic = styled(Music)`
  > .lrc {
    margin: 0 20px 0 65px;
    padding: 5px 0 10px 0;

    border-top: 1px solid rgb(0 0 0 / 0.05);
  }

  &:nth-child(odd) {
    background-color: rgb(0 0 0 / 0.02);
  }
`;
const Line = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  .highlight {
    color: ${CSSVariable.COLOR_PRIMARY};
  }
`;

function MusicWithLyric({
  music,
  keyword,
}: {
  music: MusicWithLyricType;
  keyword: string;
}) {
  const miniMode = mm.useState();
  const replacement = new RegExp(keyword.toLowerCase(), 'i');
  return (
    <StyledMusic
      music={music}
      miniMode={miniMode}
      addon={
        <Lrc
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
