import { MusicType } from '@/constants/music';
import { CSSVariable } from '@/global_style';
import { MultipleLrc } from 'react-lrc';
import styled from 'styled-components';
import { t } from '@/i18n';
import { MusicDetail } from './constants';

const Style = styled.section`
  margin: 22px 20px 4px;

  > .label {
    margin-bottom: 10px;

    color: rgb(75 75 75);
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.2;
  }

  > .content {
    padding: 8px 0 12px;

    background: #fff;
    border: 2px solid rgb(229 229 229);
    border-radius: 14px;
    box-shadow: 0 4px 0 rgb(229 229 229);
  }
`;
const Line = styled.div`
  margin: 10px 16px;

  line-height: 1.4;
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  font-weight: 600;
  color: rgb(120 120 120);
`;

function Lyric({ music }: { music: MusicDetail }) {
  return (
    <Style>
      <div className="label">{t('lyric')}</div>
      <div className="content">
        {music.type === MusicType.SONG ? (
          music.lyrics.length ? (
            <MultipleLrc
              lrcs={music.lyrics.map((l) => l.lrc)}
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
        )}
      </div>
    </Style>
  );
}

export default Lyric;
