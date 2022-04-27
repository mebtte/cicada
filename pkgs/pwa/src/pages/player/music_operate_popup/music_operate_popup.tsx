import React from 'react';
import styled from 'styled-components';

import VerticalDrawer from '@/components/vertical_drawer';
import { Name } from '@/components/icon';
import { Music as MusicType } from '../constants';
import useMusicOperate from '../use_music_operate';
import MusicInfo from '../components/music_info';
import MenuItem from './menu_item';

const MusicInfoWrapper = styled.div`
  padding: 10px 20px;
`;
const bodyProps = {
  style: {
    padding: '10px 0 5px 0',
  },
};

const MusicOperateDrawer = ({
  open,
  onClose,
  music,
}: {
  open: boolean;
  onClose: () => void;
  music: MusicType;
}) => {
  const {
    onPlay,
    onAddToPlayqueue,
    onAddToMusicbill,
    onAddToPlaylist,
    onWatchMv,
    onCopyID,
  } = useMusicOperate(music, onClose);

  return (
    <VerticalDrawer open={open} onClose={onClose} bodyProps={bodyProps}>
      {music ? (
        <MusicInfoWrapper>
          <MusicInfo music={music} />
        </MusicInfoWrapper>
      ) : null}
      <MenuItem icon={Name.PLAY_OUTLINE} label="播放" onClick={onPlay} />
      <MenuItem
        icon={Name.INSERT_OUTLINE}
        label="下一首播放"
        onClick={onAddToPlayqueue}
      />
      <MenuItem
        icon={Name.ADD_TO_OUTLINE}
        label="添加到歌单"
        onClick={onAddToMusicbill}
      />
      <MenuItem
        icon={Name.PLUS_OUTLINE}
        label="添加到播放列表"
        onClick={onAddToPlaylist}
      />
      {music && music.mvLink ? (
        <MenuItem
          icon={Name.VIDEO_OUTLINE}
          label="观看MV"
          onClick={onWatchMv}
        />
      ) : null}
      <MenuItem icon={Name.COPY_OUTLINE} label="复制 ID" onClick={onCopyID} />
    </VerticalDrawer>
  );
};

export default React.memo(MusicOperateDrawer);
