import { MusicType } from '@/constants/music';
import { CSSVariable } from '@/global_style';
import { MultipleLrc } from 'react-lrc';
import styled from 'styled-components';
import { saveAs } from 'file-saver';
import { t } from '@/i18n';
import capitalize from '@/style/capitalize';
import formatMusicFilename from '@/utils/format_music_filename';
import { useUser } from '@/global_states/server';
import { useSetting } from '@/global_states/setting';
import { MusicDetail } from './constants';
import { PAGE_HORIZONTAL_PADDING } from '../pages/page';
import { FileDownload } from '@/components/icon';

const Style = styled.section`
  margin: 22px ${PAGE_HORIZONTAL_PADDING} 4px;

  > .label {
    margin-bottom: 10px;

    color: rgb(75 75 75);
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.2;
    ${capitalize}
  }

  > .content {
    position: relative;
    padding: 8px 0 12px;

    background: #fff;
    border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    border-radius: 14px;
    box-shadow: 0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  }
`;
const Line = styled.div`
  margin: 10px 16px;

  line-height: 1.4;
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  font-weight: 600;
  color: rgb(120 120 120);
`;

const DOWNLOAD_BTN_OFFSET = 2;
const DownloadButton = styled.button`
  position: absolute;
  right: 10px;
  bottom: ${10 + DOWNLOAD_BTN_OFFSET}px;

  width: 22px;
  height: 22px;
  padding: 0;
  margin: 0;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  color: rgb(120 120 120);
  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 8px;
  box-shadow: 0 ${DOWNLOAD_BTN_OFFSET}px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform, box-shadow;
  appearance: none;
  -webkit-appearance: none;

  opacity: 0.4;
  transition:
    opacity 160ms ease,
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }

  &:hover {
    filter: brightness(1.04);
  }

  &:active {
    transform: translateY(${DOWNLOAD_BTN_OFFSET}px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_CONTROL_NEUTRAL};
    outline-offset: 2px;
  }
`;

function Lyric({ music }: { music: MusicDetail }) {
  const user = useUser();
  const adminQuickEdit = useSetting((s) => s.adminQuickEdit);

  // 乐曲或没有歌词的歌曲, 不展示歌词模块
  if (music.type !== MusicType.SONG || music.lyrics.length === 0) {
    return null;
  }

  // 下载按钮归入「管理员快捷编辑」开关
  const downloadable = !!user?.admin && adminQuickEdit;

  const downloadLyrics = () => {
    const performerNames = music.performers.map((s) => s.name);
    // 单条歌词不加 (n) 后缀, 多条则按 1..N 顺序追加
    const multiple = music.lyrics.length > 1;
    music.lyrics.forEach((lyric, i) => {
      const filename = formatMusicFilename({
        name: music.name,
        performerNames,
        ext: 'lrc',
        index: multiple ? i + 1 : undefined,
      });
      saveAs(
        new Blob([lyric.lrc], { type: 'text/plain;charset=utf-8' }),
        filename,
      );
    });
  };

  return (
    <Style>
      <div className="label">{t('lyric')}</div>
      <div className="content">
        <MultipleLrc
          lrcs={music.lyrics.map((l) => l.lrc)}
          lineRenderer={({ line }) => (
            <Line key={line.id}>
              {line.children.map((child) => (
                <div key={child.id}>{child.content}</div>
              ))}
            </Line>
          )}
        />
        {downloadable ? (
          <DownloadButton
            type="button"
            aria-label={t('download_lyric')}
            onClick={downloadLyrics}
          >
            <FileDownload />
          </DownloadButton>
        ) : null}
      </div>
    </Style>
  );
}

export default Lyric;
