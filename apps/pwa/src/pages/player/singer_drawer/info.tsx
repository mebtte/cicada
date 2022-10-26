import { CSSVariable } from '#/global_style';
import absoluteFullSize from '#/style/absolute_full_size';
import ellipsis from '#/style/ellipsis';
import styled from 'styled-components';
import { SingerDetail } from './constants';

const Style = styled.div`
  position: relative;

  > .cover-box {
    position: relative;

    padding-bottom: 100%;

    > .cover {
      ${absoluteFullSize}

      object-fit: cover;
      /* mask-image: linear-gradient(
        180deg,
        rgb(0 0 0 / 1) 80%,
        rgb(0 0 0 / 0) 100%
      ); */
    }
  }

  > .info {
    position: absolute;
    left: 40px;
    bottom: 10px;
    width: calc(100% - 80px);

    padding: 10px 20px;
    border-radius: 4px;
    background-color: rgb(255 255 255 / 0.75);

    > .name {
      font-size: 24px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      ${ellipsis}
    }

    > .aliases {
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      ${ellipsis}
    }
  }
`;

function Info({ singer }: { singer: SingerDetail }) {
  return (
    <Style>
      <div className="cover-box">
        <img className="cover" src={singer.avatar} alt="singer avatar" />
      </div>

      <div className="info">
        <div className="name" title={singer.name}>
          {singer.name}
        </div>
        {singer.aliases.length ? (
          <div className="aliases" title={singer.aliases.join('; ')}>
            {singer.aliases.join('; ')}
          </div>
        ) : null}
      </div>
    </Style>
  );
}

export default Info;
