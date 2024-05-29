import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { Singer } from './constants';
import JpegDefaultSingerAvatar from '@/asset/default_cover.jpeg';

const Style = styled.div`
  position: relative;

  font-size: 0;

  > .info {
    position: absolute;
    left: 0;
    bottom: 0;
    max-width: 90%;

    padding: 10px 20px;
    background-color: rgb(255 255 255 / 0.75);
    border-top-right-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};

    > .name {
      font-size: 28px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .aliases {
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }
`;

function Info({ singer }: { singer: Singer }) {
  return (
    <Style>
      <Cover
        src={singer.avatar}
        size="100%"
        shape={Shape.SQUARE}
        defaultSrc={JpegDefaultSingerAvatar}
      />

      <div className="info">
        <div className="name">{singer.name}</div>
        {singer.aliases.length ? (
          <div className="aliases">
            {singer.aliases.map((alias, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="alias" key={index}>
                {alias}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Style>
  );
}

export default Info;
