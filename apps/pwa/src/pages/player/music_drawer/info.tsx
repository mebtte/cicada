import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import Cover from '@/components/cover';
import {
  MdOutlineDateRange,
  MdOutlineLocalFireDepartment,
  MdFilePresent,
  MdAccessTime,
} from 'react-icons/md';
import { MusicDetail } from './constants';

const Style = styled.div`
  position: relative;

  > .info {
    position: absolute;
    left: 0;
    bottom: 0;
    max-width: 85%;

    padding: 10px 20px;
    background-color: rgb(255 255 255 / 0.75);

    > .name {
      font-size: 28px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .aliases {
      margin-top: 5px;

      font-size: 14px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }

    > .extra {
      margin-top: 5px;

      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};

      display: flex;
      align-items: center;

      > .part {
        display: flex;
        align-items: center;
        gap: 3px;

        > .icon {
          font-size: 14px;
        }

        > .value {
          font-family: monospace;
        }

        &:not(:last-child)::after {
          content: ' · ';
          padding: 0 5px;
        }
      }
    }
  }
`;
const formatDuration = (duration: number) => {
  const minute = Math.floor(duration / 60);
  const second = Math.floor(duration % 60);
  return `${minute > 9 ? minute : `0${minute}`}:${
    second > 9 ? second : `0${second}`
  }`;
};

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
        <div className="extra">
          <div className="part" title="发行年份">
            <MdOutlineDateRange className="icon" />
            <div className="value">2023</div>
          </div>
          <div className="part" title="时长">
            <MdAccessTime className="icon" />
            <div className="value">{formatDuration(music.duration)}</div>
          </div>
          <div className="part" title="文件大小">
            <MdFilePresent className="icon" />
            <div className="value">
              {(music.size / 1024 / 1024).toFixed(2)}MB
            </div>
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
