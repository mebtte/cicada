import { CSSVariable } from '@/global_style';
import {
  MdAccessTime,
  MdFilePresent,
  MdOutlineCalendarToday,
  MdOutlineLocalFireDepartment,
  MdOutlinePostAdd,
} from 'react-icons/md';
import styled from 'styled-components';
import { MusicDetail } from './constants';
import Tag from './tag';

const Style = styled.div`
  margin-top: 10px;

  > .name {
    margin: 0 20px;

    font-size: 28px;
    font-weight: bold;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }

  > .aliases {
    margin: 0 20px 5px 20px;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }

  > .tags {
    margin: 0 20px 5px 20px;

    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px 10px;
  }
`;
const formatDuration = (duration: number) => {
  const minute = Math.floor(duration / 60);
  const second = Math.floor(duration % 60);
  return `${minute > 9 ? minute : `0${minute}`}:${
    second > 9 ? second : `0${second}`
  }`;
};

function Info2({ music }: { music: MusicDetail }) {
  const assetParts = music.asset.split('.');
  const assetFormat = assetParts[assetParts.length - 1];
  return (
    <Style>
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
      <div className="tags">
        {music.year ? (
          <Tag
            title="发行年份"
            icon={<MdOutlineCalendarToday />}
            text={music.year}
          />
        ) : null}
        {music.duration ? (
          <Tag
            title="时长"
            icon={<MdAccessTime />}
            text={formatDuration(music.duration)}
          />
        ) : null}
        {music.size ? (
          <Tag
            title="文件大小"
            icon={<MdFilePresent />}
            text={`${(music.size / 1024 / 1024).toFixed(2)}MB`}
          />
        ) : null}
        <Tag
          title="文件类型"
          icon={<MdFilePresent />}
          text={assetFormat.toUpperCase()}
        />
        <Tag
          title="加入乐单数量"
          icon={<MdOutlinePostAdd />}
          text={music.musicbillCount}
        />
        <Tag
          title="热度"
          icon={<MdOutlineLocalFireDepartment />}
          text={music.heat}
        />
      </div>
    </Style>
  );
}

export default Info2;
