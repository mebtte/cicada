import React, { useCallback } from 'react';
import styled from 'styled-components';

import Tooltip, { Placement } from '@/components/tooltip';
import IconButton, { Name } from '@/components/icon_button';
import dialog from '@/platform/dialog';
import toast from '@/platform/toast';
import { Singer } from './constants';
import eventemitter, { EventType } from '../eventemitter';

const ACTION_SIZE = 28;
const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 20px;
`;
const iconButtonStyle = {
  margin: '5px 0',
};

const Action = ({ singer, reload }: { singer: Singer; reload: () => void }) => {
  const copySingerID = useCallback(
    () =>
      window.navigator.clipboard
        .writeText(singer.id)
        .then(() => toast.success(`已复制「${singer.id}」`))
        .catch((error) =>
          dialog.alert({
            title: '复制失败',
            content: error.message,
          }),
        ),
    [singer],
  );
  return (
    <Style>
      <Tooltip title="重新加载" placement={Placement.LEFT}>
        <IconButton
          name={Name.REFRESH_OUTLINE}
          size={ACTION_SIZE}
          onClick={reload}
          style={iconButtonStyle}
        />
      </Tooltip>
      <Tooltip title="全部添加到歌单" placement={Placement.LEFT}>
        <IconButton
          name={Name.PLUS_OUTLINE}
          size={ACTION_SIZE}
          onClick={() =>
            eventemitter.emit(EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST, {
              musicList: singer.musicList.map((m) => m.music),
            })
          }
          style={iconButtonStyle}
        />
      </Tooltip>
      <Tooltip title="复制歌手 ID" placement={Placement.LEFT}>
        <IconButton
          name={Name.COPY_OUTLINE}
          size={ACTION_SIZE}
          onClick={copySingerID}
          style={iconButtonStyle}
        />
      </Tooltip>
    </Style>
  );
};

export default Action;
