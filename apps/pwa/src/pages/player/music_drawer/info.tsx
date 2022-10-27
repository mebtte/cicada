import { CSSVariable } from '#/global_style';
import absoluteFullSize from '#/style/absolute_full_size';
import styled from 'styled-components';
import { MusicDetail } from './constants';

const Style = styled.div`
  position: relative;

  > .cover-box {
    position: relative;

    padding-bottom: 100%;

    > .cover {
      ${absoluteFullSize}

      object-fit: cover;
    }
  }

  > .info {
    position: absolute;
    left: 0;
    bottom: 10px;
    max-width: 90%;

    padding: 10px 20px;
    border-radius: 0 4px 4px 0;
    background-color: rgb(255 255 255 / 0.75);

    > .name {
      font-size: 28px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .aliases {
      font-size: 14px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }
`;

function Info({ music }: { music: MusicDetail }) {
  return (
    <Style>
      <div className="cover-box">
        <img
          className="cover"
          src={music.cover}
          alt="music cover"
          crossOrigin="anonymous"
        />
      </div>
      <div className="info">
        <div className="name">{music.name}</div>
        {music.aliases.length ? (
          <div className="aliases">{music.aliases.join('; ')}</div>
        ) : null}
      </div>
    </Style>
  );
}

export default Info;
