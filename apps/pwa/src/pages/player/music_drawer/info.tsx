import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import Cover from '@/components/cover';
import {
  MdOutlineDateRange,
  MdOutlineLocalFireDepartment,
} from 'react-icons/md';
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

    > .aliases {
      font-size: 14px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }

    > .name {
      font-size: 28px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .extra {
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};

      display: flex;
      align-items: center;
      gap: 15px;

      > .part {
        display: flex;
        align-items: center;
        gap: 3px;
      }
    }
  }
`;

function Info({ music }: { music: MusicDetail }) {
  return (
    <Style>
      <Cover src={music.cover} size="100%" />
      <div className="info">
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
        <div className="name">{music.name}</div>
        <div className="extra">
          <div className="part" title="发行年份">
            <MdOutlineDateRange className="icon" />
            <div className="value">2023</div>
          </div>
          <div className="part" title="热度">
            <MdOutlineLocalFireDepartment className="icon" />
            <div className="value">{music.heat}</div>
          </div>
        </div>
      </div>
    </Style>
  );
}

export default Info;
