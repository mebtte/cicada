import styled from 'styled-components';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import getResizedImage from '@/server/asset/get_resized_image';
import { Music } from '../constants';
import MusicInfo from '../components/music_info';
import { FLOATING_GAP } from './constants';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;

const Style = styled.div`
  z-index: 1;

  position: sticky;
  top: 0;

  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;

  > .music-info {
    /* 比下方乐单条目更窄, 悬浮在上方时通过左右缩进与乐单区分, 避免视觉融合 */
    margin: 0 24px;

    pointer-events: auto;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgb(255 255 255 / 0.96);
    border: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 14px;
    box-shadow: 0 4px 0 ${NEUTRAL_SHADOW};
    transition:
      transform 150ms ease-out,
      box-shadow 150ms ease-out,
      border-color 150ms ease-out,
      filter 120ms ease-out;

    > :first-child {
      flex: 0 0 auto;
      box-sizing: border-box;
      overflow: hidden;

      background: #fff;
      border: 2px solid ${CSSVariable.COLOR_BORDER};
      border-radius: 10px;
      box-shadow: 0 3px 0 ${NEUTRAL_SHADOW};
    }

    > .info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    > .info > .name {
      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0;
      line-height: 1.2;
      color: rgb(50 50 50);
    }

    > .info > .performers {
      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0;
      line-height: 1.25;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};

      .name {
        font-weight: 800;
      }
    }

    &:hover {
      background: #fff;
      border-color: ${PRIMARY};
      filter: brightness(1.03);
    }

    &:active {
      transform: translateY(4px);
      box-shadow: none;
      transition:
        transform 60ms ease-in,
        box-shadow 60ms ease-in,
        filter 60ms ease-in;
    }
  }
`;

function Top({ music }: { music: Music }) {
  const { height } = useTitlebarArea();

  return (
    <Style
      style={{
        padding: `${height + FLOATING_GAP}px 0 0 0`,
      }}
    >
      <MusicInfo
        className="music-info"
        musicId={music.id}
        musicName={music.name}
        musicCover={getResizedImage({ url: music.cover, size: 80 })}
        musicCoverThumbnail={music.coverThumbnail}
        performers={music.performers}
      />
    </Style>
  );
}

export default Top;
