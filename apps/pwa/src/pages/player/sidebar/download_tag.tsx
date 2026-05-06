import { useContext, useMemo } from 'react';
import styled from 'styled-components';
import context from '../context';
import { DownloadStatus } from '../constants';

const Style = styled.div`
  min-width: 34px;
  padding: 3px 6px;

  border-radius: 999px;
  background: rgb(0 0 0 / 0.08);

  font-family: monospace;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  text-align: center;
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
