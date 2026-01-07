import styled from 'styled-components';
import { DownloadingMusic, DownloadStatus } from '../constants';
import { useMemo } from 'react';
import { flexCenter } from '@/style/flexbox';
import { CSSVariable } from '@/global_style';
import usePosition from './use_position';
import { SIZE } from './constants';
import { ZIndex } from '../../constants';

const Style = styled.div`
  z-index: ${ZIndex.FLOATING};
  position: absolute;

  width: ${SIZE}px;
  height: ${SIZE}px;

  ${flexCenter}

  border-radius: 50%;
  cursor: pointer;
  user-select: none;
  font-family: monospace;
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  border: 1px solid ${CSSVariable.COLOR_PRIMARY_DISABLED};
`;

function Floating({
  downloadingMusicList,
  onOpenDrawer,
}: {
  downloadingMusicList: DownloadingMusic[];
  onOpenDrawer: () => void;
}) {
  const { position, ref, onPointerDown, onPointerUp, onPointerMove } =
    usePosition();
  const downloadedLength = useMemo(
    () =>
      downloadingMusicList.filter(
        (m) =>
          m.status === DownloadStatus.SUCCESSFUL ||
          m.status === DownloadStatus.FAILED,
      ).length,
    [downloadingMusicList],
  );
  const percentage = (downloadedLength / downloadingMusicList.length) * 100;
  return position ? (
    <Style
      ref={ref}
      style={{
        top: position.y,
        left: position.x,
        background: `conic-gradient(${CSSVariable.COLOR_PRIMARY} ${percentage}%, transparent 0)`,
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
      onClick={onOpenDrawer}
    >
      {downloadingMusicList.length > 99 ? `99+` : downloadingMusicList.length}
    </Style>
  ) : null;
}

export default Floating;
