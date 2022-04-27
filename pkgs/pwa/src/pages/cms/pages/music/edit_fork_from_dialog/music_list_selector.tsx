import React, { HTMLAttributes, useRef, useState } from 'react';
import styled from 'styled-components';
import debounce from 'lodash/debounce';

import searchMusic, { KEYWORD_MAX_LENGTH } from '@/server/search_music';
import ellipsis from '@/style/ellipsis';
import IconButton, { Name, Type } from '@/components/icon_button';
import logger from '@/platform/logger';
import toast from '@/platform/toast';
import Select from '@/components/select';
import Label from '@/components/label';
import { Music } from './constants';

const Style = styled.div`
  > .select {
    width: 100%;
  }
  > .music-list {
    > .music {
      display: flex;
      gap: 10px;
      padding: 10px 12px;
      background-color: #f6f6f6;
      border-radius: 4px;
      margin: 5px 0;
      > .name {
        flex: 1;
        min-width: 0;
        font-size: 14px;
        color: #333;
        ${ellipsis}
      }
    }
  }
`;
const itemRenderer = (music: Music | null) =>
  music
    ? `${music.name} - ${
        music.singers.map((s) => s.name).join(',') || '未知歌手'
      }`
    : null;

const MusicListSelector = ({
  musicList,
  onMusicSelect,
  onMusicRemove,
  disabled,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  musicList: Music[];
  onMusicSelect: (music: Music) => void;
  onMusicRemove: (music: Music) => void;
  disabled: boolean;
}) => {
  const [loading, setLoading] = useState(0);
  const [searchMusicList, setSearchMusicList] = useState<Music[]>([]);

  const onInputChangeRef = useRef(
    debounce(async (keyword: string) => {
      if (!keyword) {
        return setSearchMusicList([]);
      }
      setLoading((l) => l + 1);
      try {
        const { list: ml } = await searchMusic({
          keyword: keyword.slice(0, KEYWORD_MAX_LENGTH),
          pageSize: 50,
        });
        setSearchMusicList(
          ml.map(({ id, name, singers }) => ({
            id,
            name,
            singers,
          })),
        );
      } catch (error) {
        logger.error(error, { description: '搜索音乐失败', report: true });
        toast.error(error.message);
      }
      setLoading((l) => l - 1);
    }, 500),
  );

  return (
    <Label {...props} label="音乐列表">
      <Style>
        <Select
          className="select"
          value={null}
          onChange={onMusicSelect}
          array={searchMusicList}
          itemRenderer={itemRenderer}
          onInputChange={onInputChangeRef.current}
          loading={loading > 0}
          placeholder="搜索音乐"
          disabled={disabled}
        />
        <div className="music-list">
          {musicList.map((music) => (
            <div className="music" key={music.id}>
              <div className="name">{itemRenderer(music)}</div>
              <IconButton
                name={Name.WRONG_OUTLINE}
                size={18}
                type={Type.DANGER}
                onClick={() => onMusicRemove(music)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </Style>
    </Label>
  );
};

export default MusicListSelector;
