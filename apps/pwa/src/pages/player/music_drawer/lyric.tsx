import { MusicType } from '@/constants/music';
import { CSSVariable } from '@/global_style';
import { MultipleLrc } from 'react-lrc';
import styled from 'styled-components';
import { t } from '@/i18n';
import capitalize from '@/style/capitalize';
import { MusicDetail } from './constants';
import { PAGE_HORIZONTAL_PADDING } from '../pages/page';

const Style = styled.section`
  margin: 22px ${PAGE_HORIZONTAL_PADDING} 4px;

  > .label {
    margin-bottom: 10px;

    color: rgb(75 75 75);
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.2;
    ${capitalize}
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
            <Line>{t('no_lyric')}</Line>
          )
        ) : (
          <Line>{t('instrument_without_lyric')}</Line>
        )}
      </div>
    </Style>
  );
}

export default Lyric;
