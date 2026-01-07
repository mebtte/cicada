import Drawer, { Title } from '@/components/drawer';
import { CSSProperties } from 'react';
import { DownloadingMusic } from '../constants';
import useDynamicZIndex from '../../use_dynamic_z_index';
import { EventType } from '../../eventemitter';
import MusicList from './music_list';
import Toolbar from './toolbar';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 'min(350px, 85%)',

    display: 'flex',
    flexDirection: 'column',
  },
};

function DownloadDrawer({
  open,
  onClose,
  downloadingMusicList,
  cleanAll,
  cleanSuccessful,
  retryFailed,
}: {
  open: boolean;
  onClose: () => void;
  downloadingMusicList: DownloadingMusic[];
  cleanAll: () => void;
  cleanSuccessful: () => void;
  retryFailed: () => void;
}) {
  const zIndex = useDynamicZIndex(EventType.DOWNLOAD_MUSIC_LIST);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      <Title>下载列表</Title>
      <MusicList downloadingMusicList={downloadingMusicList} />
      <Toolbar
        downloadingMusicList={downloadingMusicList}
        cleanAll={cleanAll}
        cleanSuccessful={cleanSuccessful}
        retryFailed={retryFailed}
        onClose={onClose}
      />
    </Drawer>
  );
}

export default DownloadDrawer;
