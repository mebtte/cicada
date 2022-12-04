import { CSSProperties, memo } from 'react';
import {
  MdDownload,
  MdPlaylistAdd,
  MdPlayArrow,
  MdReadMore,
  MdOutlinePostAdd,
} from 'react-icons/md';
import Popup from '@/components/popup';
import MenuItem from '@/components/menu_item';
import { IS_IPAD, IS_IPHONE } from '@/constants/browser';
import { Music as MusicType } from '../constants';
import useMusicOperate from '../use_music_operate';
import MusicInfo from '../components/music_info';

const bodyProps: { style: CSSProperties } = {
  style: {
    maxWidth: 350,
    padding: '10px 0 max(env(safe-area-inset-bottom, 10px), 10px) 0',
  },
};

function MusicOperateDrawer({
  zIndex,
  open,
  onClose,
  music,
}: {
  zIndex: number;
  open: boolean;
  onClose: () => void;
  music: MusicType;
}) {
  const {
    onPlay,
    onAddToPlayqueue,
    onAddToMusicbill,
    onAddToPlaylist,
    onOpenDownloadDialog,
  } = useMusicOperate(music, onClose);

  return (
    <Popup
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      <MusicInfo music={music} />
      <MenuItem icon={<MdPlayArrow />} label="播放" onClick={onPlay} />
      <MenuItem
        icon={<MdReadMore />}
        label="下一首播放"
        onClick={onAddToPlayqueue}
      />
      <MenuItem
        icon={<MdOutlinePostAdd />}
        label="添加到乐单"
        onClick={onAddToMusicbill}
      />
      <MenuItem
        icon={<MdPlaylistAdd />}
        label="添加到播放列表"
        onClick={onAddToPlaylist}
      />
      {IS_IPHONE || IS_IPAD ? null : (
        <MenuItem
          icon={<MdDownload />}
          label="下载"
          onClick={onOpenDownloadDialog}
        />
      )}
    </Popup>
  );
}

export default memo(MusicOperateDrawer);
