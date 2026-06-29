import { type Ref } from 'react';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import { MusicDetail } from './constants';
import { t } from '@/i18n';
import { PAGE_HORIZONTAL_PADDING } from '../../page_layout';

const Style = styled.section<{ $showTitle: boolean }>`
  padding: ${({ $showTitle }) =>
    $showTitle
      ? `22px ${PAGE_HORIZONTAL_PADDING} 0`
      : `18px ${PAGE_HORIZONTAL_PADDING} 0`};

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

    > .meta {
      margin-top: 10px;

      color: rgb(145 145 145);
      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 800;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
  }
`;

const formatDurationMs = (durationMs: number) => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minute = Math.floor(totalSeconds / 60);
  const second = totalSeconds % 60;
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
const formatBitRate = (bitRate: number) => `${Math.round(bitRate / 1000)}kbps`;

function MusicMetaLine({ music }: { music: MusicDetail }) {
  const metaList = [
    music.assetDurationMs ? formatDurationMs(music.assetDurationMs) : '',
    music.year ? `${music.year}` : '',
    t('heat', music.heat.toString()),
    t('musicbill_count', music.musicbillCount.toString()),
    music.assetCodec ? music.assetCodec.toUpperCase() : '',
    music.assetBitRate ? formatBitRate(music.assetBitRate) : '',
    music.assetSize ? formatFileSize(music.assetSize) : '',
  ].filter(Boolean);

  return metaList.length ? (
    <div className="meta">{metaList.join(' · ')}</div>
  ) : null;
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
        <MusicMetaLine music={music} />
      </div>
    </Style>
  );
}

export default Info;
