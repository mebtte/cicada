import styled from 'styled-components';
import { TOOLBAR_HEIGHT } from '../constants';
import Button from '@/components_next/button';
import { MdPlaylistRemove, MdOutlineRestartAlt } from 'react-icons/md';
import { useContext, useMemo } from 'react';
import context from '@/pages/player/context';
import dialog from '@/utils/dialog';
import eventemitter, { EventType } from '@/pages/player/eventemitter';
import { DownloadStatus } from '@/pages/player/constants';

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: ${TOOLBAR_HEIGHT}px;
  left: 0;
  bottom: 0;

  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  backdrop-filter: blur(5px);
`;

function Toolbar() {
  const { downloadingMusicList } = useContext(context);
  const failed = useMemo(
    () => downloadingMusicList.find((m) => m.status === DownloadStatus.FAILED),
    [downloadingMusicList],
  );
  return (
    <Style>
      <Button
        square
        variant="plain"
        size="sm"
        disabled={downloadingMusicList.length === 0}
        onClick={() =>
          dialog.confirm({
            content: '确定移除所有下载项吗?',
            onConfirm: () =>
              eventemitter.emit(EventType.DOWNLOAD_MUSIC_LIST_CLEAN_ALL, null),
          })
        }
      >
        <MdPlaylistRemove />
      </Button>
      <Button
        square
        variant="plain"
        size="sm"
        disabled={!failed}
        onClick={() =>
          eventemitter.emit(EventType.DOWNLOAD_MUSIC_LIST_RETRY_FAILED, null)
        }
      >
        <MdOutlineRestartAlt />
      </Button>
    </Style>
  );
}

export default Toolbar;
