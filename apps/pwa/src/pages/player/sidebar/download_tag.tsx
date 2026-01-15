import { useContext, useMemo } from 'react';
import styled from 'styled-components';
import context from '../context';
import { DownloadStatus } from '../constants';

const Style = styled.div`
  font-size: 12px;
  font-family: monospace;
`;

function DownloadTag() {
  const { downloadingMusicList } = useContext(context);
  const ended = useMemo(
    () =>
      downloadingMusicList.filter(
        (m) =>
          m.status === DownloadStatus.FAILED ||
          m.status === DownloadStatus.SUCCESSFUL,
      ),
    [downloadingMusicList],
  );
  return (
    <Style>
      {ended.length}/{downloadingMusicList.length}
    </Style>
  );
}

export default DownloadTag;
