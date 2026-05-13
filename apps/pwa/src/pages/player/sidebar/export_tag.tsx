import { useContext, useMemo } from 'react';
import styled from 'styled-components';
import context from '../context';
import { ExportStatus } from '../constants';

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

function ExportTag() {
  const { exportingMusicList } = useContext(context);
  const ended = useMemo(
    () =>
      exportingMusicList.filter(
        (m) =>
          m.status === ExportStatus.FAILED ||
          m.status === ExportStatus.SUCCESSFUL,
      ),
    [exportingMusicList],
  );
  return (
    <Style>
      {ended.length}/{exportingMusicList.length}
    </Style>
  );
}

export default ExportTag;
