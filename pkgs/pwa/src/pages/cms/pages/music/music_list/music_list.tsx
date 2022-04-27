import React, { useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import useHistory from '@/utils/use_history';
import day from '@/utils/day';
import Tooltip from '@/components/tooltip';
import Tag, { Type as TagType } from '@/components/tag';
import { SearchKey as FigureSearchKey } from '@/server/cms_get_figure_list';
import { SearchKey } from '@/server/cms_get_music_list';
import { CMS_PATH } from '@/constants/route';
import { MusicType, MUSIC_TYPE_MAP_LABEL } from '@/constants/music';
import Avatar from '@/components/avatar';
import IconButton, { Name } from '@/components/icon_button';
import CircularLoader from '@/components/circular_loader';
import Empty from '@/components/empty';
import Table from '@/components/table';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import { EditMusicResourceType, Music, Query } from '../constants';
import eventemitter, { EventType } from '../eventemitter';

const Style = styled.div<{ isLoading: boolean }>`
  flex: 1;
  min-height: 0;
  position: relative;
  > .content {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: auto;
    ${scrollbarAsNeeded}
    >.table {
      width: 100%;
    }
  }
  > .loading {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ${({ isLoading }) => css`
    > .content {
      opacity: ${isLoading ? 0.5 : 1};
    }
  `}
`;
const emptyStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
};
const Small = styled.span`
  font-size: 12px;
`;
const CoverBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-color-secondary);
`;
const ACTION_SIZE = 22;
const SingerBox = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  > .singer-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    > .singer {
      text-decoration: none;
      color: #333;
      display: inline-block;
      border: 1px solid rgb(49 194 124 / 0.3);
      border-radius: 2px;
      padding: 2px 8px;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
  }
`;
const headers = [
  'ID',
  '名字',
  '封面',
  '类型',
  '歌手',
  '别名',
  '资源',
  '是否可推荐',
  '创建时间',
  '操作',
];
const ResourceBox = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  > .action {
    cursor: pointer;
  }
`;
const OperationBox = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
`;

const MusicList = ({
  loading,
  musicList,
  page,
  searchKey,
  searchValue,
}: {
  loading: boolean;
  musicList: Music[];
  page: number;
  searchKey: SearchKey;
  searchValue: string;
}) => {
  const history = useHistory();
  const contentRef = useRef<HTMLDivElement>();

  const rowRenderer = (music: Music) => [
    <Small>{music.id}</Small>,
    music.name,
    <CoverBox>
      {music.cover ? <Avatar src={music.cover} /> : '-'}
      <IconButton
        name={Name.EDIT_OUTLINE}
        size={ACTION_SIZE}
        onClick={() =>
          eventemitter.emit(EventType.OPEN_EDIT_COVER_DIALOG, music)
        }
      />
    </CoverBox>,
    <Small>{MUSIC_TYPE_MAP_LABEL[music.type]}</Small>,
    <SingerBox>
      <div className="singer-list">
        {music.singers.map((s) => (
          <Link
            key={s.id}
            className="singer"
            to={`${CMS_PATH.FIGURE}?${Query.SEARCH_KEY}=${FigureSearchKey.ID}&${Query.SEARCH_VALUE}=${s.id}`}
          >
            {s.name}
          </Link>
        ))}
      </div>
      <IconButton
        name={Name.EDIT_OUTLINE}
        size={ACTION_SIZE}
        onClick={() =>
          eventemitter.emit(EventType.OPEN_EDIT_SINGER_LIST_DIALOG, music)
        }
      />
    </SingerBox>,
    <Small>{music.alias || '-'}</Small>,
    <ResourceBox>
      <Tooltip title="标准音质">
        <Tag
          className="action"
          type={TagType.SQ}
          onClick={() =>
            eventemitter.emit(EventType.OPEN_EDIT_RESOURCE_DIALOG, {
              music,
              type: EditMusicResourceType.SQ,
            })
          }
        />
      </Tooltip>
      <Tooltip title="无损音质">
        <Tag
          className="action"
          type={TagType.HQ}
          gray={!music.hq}
          onClick={() =>
            eventemitter.emit(EventType.OPEN_EDIT_RESOURCE_DIALOG, {
              music,
              type: EditMusicResourceType.HQ,
            })
          }
        />
      </Tooltip>
      {music.type === MusicType.NORMAL ? (
        <Tooltip title="伴奏">
          <Tag
            className="action"
            type={TagType.AC}
            gray={!music.ac}
            onClick={() =>
              eventemitter.emit(EventType.OPEN_EDIT_RESOURCE_DIALOG, {
                music,
                type: EditMusicResourceType.AC,
              })
            }
          />
        </Tooltip>
      ) : null}
      <Tag
        className="action"
        type={TagType.MV}
        gray={!music.mvLink}
        onClick={() => eventemitter.emit(EventType.OPEN_EDIT_DIALOG, music)}
      />
      <Tooltip title="二次创作">
        <Tag
          className="action"
          type={TagType.FORK_FROM}
          gray={!music.forkFrom.length}
          onClick={() =>
            eventemitter.emit(EventType.OPEN_EDIT_FORK_FROM_DIALOG, music)
          }
        />
      </Tooltip>
    </ResourceBox>,
    <Small>{music.recommendable ? '√' : '×'}</Small>,
    <Small>{day(music.createTime).format('YYYY-MM-DD HH:mm')}</Small>,
    <OperationBox>
      <IconButton
        name={Name.EDIT_OUTLINE}
        size={ACTION_SIZE}
        onClick={() => eventemitter.emit(EventType.OPEN_EDIT_DIALOG, music)}
      />
      <IconButton
        name={Name.HISTORY_OUTLINE}
        size={ACTION_SIZE}
        onClick={() =>
          history.push({
            query: {
              [Query.OPERATE_RECORD_DIALOG_OPEN]: '1',
              [Query.OPERATE_RECORD_DIALOG_MUSIC_ID]: music.id,
            },
          })
        }
      />
      {music.type === MusicType.NORMAL ? (
        <IconButton
          name={Name.LYRIC_OUTLINE}
          size={ACTION_SIZE}
          onClick={() =>
            eventemitter.emit(EventType.OPEN_EDIT_LRC_DIALOG, music)
          }
        />
      ) : null}
    </OperationBox>,
  ];

  useEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    contentRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [page, searchKey, searchValue]);

  return (
    <Style isLoading={loading}>
      {loading || musicList.length ? (
        <div className="content" ref={contentRef}>
          <Table
            className="table"
            list={musicList}
            headers={headers}
            rowRenderer={rowRenderer}
            stickyHeader
          />
        </div>
      ) : (
        <Empty style={emptyStyle} />
      )}
      {loading && (
        <div className="loading">
          <CircularLoader />
        </div>
      )}
    </Style>
  );
};

export default MusicList;
