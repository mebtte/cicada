import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import Cover from '@/components/cover';
import { MdOutlineLocalFireDepartment } from 'react-icons/md';
import { MusicDetail } from './constants';

const Style = styled.div`
  position: relative;

  > .info {
    position: absolute;
    left: 0;
    bottom: 0;
    max-width: 80%;

    padding: 10px 20px;
    background-color: rgb(255 255 255 / 0.75);

    > .tag-box {
      display: flex;
      align-items: center;
      gap: 5px;
    }

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

  > .heat {
    position: absolute;
    bottom: 0;
    right: 0;

    padding: 3px 5px 7px 5px;

    display: flex;
    align-items: center;
    gap: 3px;

    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    background-color: rgb(255 255 255 / 0.75);
  }
`;

function Info({ music }: { music: MusicDetail }) {
  return (
    <Style>
      <Cover src={music.cover} size="100%" />
      <div className="info">
        <div className="name">{music.name}</div>
        {music.aliases.length ? (
          <div className="aliases">
            {music.aliases.map((alias, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="alias" key={index}>
                {alias}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="heat" title="热度">
        <MdOutlineLocalFireDepartment />
        {music.heat}
      </div>
    </Style>
  );
}

export default Info;
