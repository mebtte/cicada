import useDownload from './use_download';
import Floating from './floating';
import { useCallback, useEffect, useState } from 'react';
import Drawer from './drawer';
import eventemitter, { EventType } from '../eventemitter';

function Download() {
  const { downloadingMusicList, cleanAll, cleanSuccessful, retryFailed } =
    useDownload();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const onOpenDrawer = useCallback(() => setDrawerOpen(true), []);
  const onCloseDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(
    () =>
      eventemitter.listen(EventType.DOWNLOAD_MUSIC_LIST, () =>
        setDrawerOpen(true),
      ),
    [],
  );

  return (
    <>
      {downloadingMusicList.length === 0 || drawerOpen ? null : (
        <Floating
          downloadingMusicList={downloadingMusicList}
          onOpenDrawer={onOpenDrawer}
        />
      )}
      <Drawer
        open={downloadingMusicList.length > 0 && drawerOpen}
        onClose={onCloseDrawer}
        downloadingMusicList={downloadingMusicList}
        cleanAll={cleanAll}
        cleanSuccessful={cleanSuccessful}
        retryFailed={retryFailed}
      />
    </>
  );
}

export default Download;
