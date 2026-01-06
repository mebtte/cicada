import useDownload from './use_download';
import Floating from './floating';

function Download() {
  const downloadingMusicList = useDownload();
  return downloadingMusicList.length ? (
    <Floating downloadingMusicList={downloadingMusicList} />
  ) : null;
}

export default Download;
