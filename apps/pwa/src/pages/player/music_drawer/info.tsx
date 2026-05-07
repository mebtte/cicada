import { type Ref } from 'react';
import { CSSVariable } from '@/global_style';
import {
  MdAccessTime,
  MdAudioFile,
  MdFilePresent,
  MdOutlineCalendarToday,
  MdOutlineLocalFireDepartment,
  MdOutlinePostAdd,
} from 'react-icons/md';
import styled from 'styled-components';
import { MusicDetail } from './constants';
import Tag from './tag';

const Style = styled.section<{ $showTitle: boolean }>`
  padding: ${({ $showTitle }) => ($showTitle ? '22px 20px 0' : '18px 20px 0')};

  > .headline {
    margin-bottom: 16px;

    > .name {
      margin: 0;

      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: 0;
      color: rgb(50 50 50);
      overflow-wrap: anywhere;
    }

    > .aliases {
      margin: 8px 0 0;

      display: flex;
      flex-direction: column;
      gap: 3px;

      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      font-weight: 600;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      line-height: 1.3;
    }
  }
`;
const MetaList = styled.div<{ $compact: boolean }>`
  width: ${({ $compact }) => ($compact ? '100%' : 'auto')};
  display: ${({ $compact }) => ($compact ? 'flex' : 'grid')};
  grid-template-columns: ${({ $compact }) =>
    $compact ? 'none' : 'repeat(auto-fit, minmax(118px, 1fr))'};
  align-items: center;
  justify-content: ${({ $compact }) => ($compact ? 'flex-start' : 'stretch')};
  flex-wrap: wrap;
  gap: ${({ $compact }) => ($compact ? '6px' : '10px')};
`;
const formatDuration = (duration: number) => {
  const minute = Math.floor(duration / 60);
  const second = Math.floor(duration % 60);
  return `${minute > 9 ? minute : `0${minute}`}:${
    second > 9 ? second : `0${second}`
  }`;
};
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)}KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)}MB`;
};
const getMusicFileType = (asset: string) => {
  const pathname = new URL(asset, window.location.origin).pathname;
  const filename = pathname.split('/').at(-1) || '';
  const extensionIndex = filename.lastIndexOf('.');

  if (extensionIndex === -1 || extensionIndex === filename.length - 1) {
    return '';
  }
  return filename.slice(extensionIndex + 1).toLowerCase();
};

export function MusicMetaList({
  music,
  compact = false,
}: {
  music: MusicDetail;
  compact?: boolean;
}) {
  const fileType = getMusicFileType(music.asset);

  return (
    <MetaList $compact={compact}>
      {music.year ? (
        <Tag
          compact={compact}
          title="发行年份"
          icon={<MdOutlineCalendarToday />}
          text={music.year}
        />
      ) : null}
      {music.duration ? (
        <Tag
          compact={compact}
          title="时长"
          icon={<MdAccessTime />}
          text={formatDuration(music.duration)}
        />
      ) : null}
      {fileType ? (
        <Tag
          compact={compact}
          title="文件类型"
          icon={<MdAudioFile />}
          text={fileType}
        />
      ) : null}
      {music.size ? (
        <Tag
          compact={compact}
          title="文件大小"
          icon={<MdFilePresent />}
          text={formatFileSize(music.size)}
        />
      ) : null}
      <Tag
        compact={compact}
        title="加入乐单数量"
        icon={<MdOutlinePostAdd />}
        text={music.musicbillCount}
      />
      <Tag
        compact={compact}
        title="热度"
        icon={<MdOutlineLocalFireDepartment />}
        text={music.heat}
      />
    </MetaList>
  );
}

function Info({
  music,
  showTitle = true,
  titleRef,
}: {
  music: MusicDetail;
  showTitle?: boolean;
  titleRef?: Ref<HTMLDivElement>;
}) {
  if (!showTitle) {
    return null;
  }

  return (
    <Style $showTitle={showTitle}>
      <div className="headline" ref={titleRef}>
        <h1 className="name">{music.name}</h1>
        {music.aliases.length ? (
          <div className="aliases">
            {music.aliases.map((alias, index) => (
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
