import React, { useCallback, useRef, useState, useEffect } from 'react';
import styled from 'styled-components';

import Input from '@/components/input';
import Tooltip, { Placement } from '@/components/tooltip';
import CircularLoader from '@/components/circular_loader';
import IconButton, { Name } from '@/components/icon_button';
import Container from '../container';
import Playlist from './playlist';
import Empty from './empty';
import filterPlaylist from './filter_playlist';
import { MusicWithIndex } from '../../constants';

const Style = styled(Container)`
  display: flex;
  flex-direction: column;
  > .action {
    display: flex;
    align-items: center;
    padding: 0 20px 10px 20px;
    > .search {
      flex: 1;
      min-width: 0;
      position: relative;
      > .input {
        width: 100%;
      }
      > .loader {
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translate(0, -50%);
      }
    }
    > .clear {
      cursor: pointer;
      margin-left: 15px;
    }
  }
`;

const Wrapper = ({
  playlist,
  onClear,
}: {
  playlist: MusicWithIndex[];
  onClear: Function;
}) => {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const onKeywordChange = useCallback((event) => {
    clearTimeout(timerRef.current);
    const { value } = event.target;
    setLoading(true);
    timerRef.current = setTimeout(() => {
      setKeyword(value ? value.toLowerCase() : value);
      setLoading(false);
    }, 1000);
  }, []);

  // auto focus
  const inputRef = useRef<HTMLInputElement>();
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current.focus(), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredPlaylist = filterPlaylist(playlist, keyword);
  return (
    <Style>
      <div className="action">
        <div className="search">
          <Input
            ref={inputRef}
            className="input"
            defaultValue={keyword}
            onChange={onKeywordChange}
            placeholder="搜索播放列表"
            type="text"
          />
          {loading && <CircularLoader size={14} className="loader" />}
        </div>
        <Tooltip title="清空播放列表" placement={Placement.LEFT}>
          <IconButton
            className="clear"
            name={Name.GARBAGE_OUTLINE}
            onClick={onClear}
          />
        </Tooltip>
      </div>
      {filteredPlaylist.length ? (
        <Playlist playlist={filteredPlaylist} />
      ) : (
        <Empty keyword={keyword} />
      )}
    </Style>
  );
};

export default Wrapper;
