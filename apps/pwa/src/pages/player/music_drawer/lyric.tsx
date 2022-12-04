import { MusicType } from '#/constants/music';
import { CSSVariable } from '@/global_style';
import { MultipleLrc } from 'react-lrc';
import styled from 'styled-components';
import { MusicDetail } from './constants';

const Line = styled.div`
  margin: 10px 20px;

  line-height: 1.3;
  font-size: 14px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

function Lyric({ music }: { music: MusicDetail }) {
  return music.type === MusicType.SONG ? (
    music.lyrics.length ? (
      <MultipleLrc
        lrcs={music.lyrics.map((l) => l.lrc)}
        // eslint-disable-next-line react/no-unstable-nested-components
        lineRenderer={({ line }) => (
          <Line key={line.id}>
            {line.children.map((child) => (
              <div key={child.id}>{child.content}</div>
            ))}
          </Line>
        )}
      />
    ) : (
      <Line>暂未收录歌词</Line>
    )
  ) : (
    <Line>乐曲, 无歌词</Line>
  );
}

export default Lyric;
