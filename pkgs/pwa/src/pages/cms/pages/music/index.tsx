import React from 'react';
import styled from 'styled-components';

import { SearchKey, SEARCH_KEYS } from '@/server/cms_get_music_list';
import useQuery from '@/utils/use_query';
import { cmsPage } from '../../style';
import Action from './action';
import CreateDialog from './create_dialog';
import MusicList from './music_list';
import { Query } from './constants';
import EditCoverDialog from './edit_cover_dialog';
import EditDialog from './edit_dialog';
import EditLrcDialog from './edit_lrc_dialog';
import EditSingerListDialog from './edit_singer_list_dialog';
import EditResourceDialog from './edit_resource_dialog';
import EditForkFromDialog from './edit_fork_from_dialog';
import OperateRecordDialog from './operate_record_dialog';

const Style = styled.div`
  ${cmsPage};
  display: flex;
`;

const Music = () => {
  const query = useQuery<Query>();

  let searchKey = query[Query.SEARCH_KEY] as SearchKey;
  if (!SEARCH_KEYS.includes(searchKey)) {
    searchKey = SearchKey.COMPOSITE;
  }
  const searchValue = query[Query.SEARCH_VALUE] || '';
  const pageString = query[Query.PAGE];
  const page = pageString ? +pageString : 1 || 1;
  const createDialogOpen = !!query[Query.CREATE_DIALOG_OPEN];

  const operateRecordDialogOpen = !!query[Query.OPERATE_RECORD_DIALOG_OPEN];
  const operateRecordDialogMusicId =
    query[Query.OPERATE_RECORD_DIALOG_MUSIC_ID];

  return (
    <Style>
      <Action />
      <MusicList page={page} searchKey={searchKey} searchValue={searchValue} />

      <CreateDialog open={createDialogOpen} />
      <EditCoverDialog />
      <EditDialog />
      <EditLrcDialog />
      <EditSingerListDialog />
      <EditResourceDialog />
      <EditForkFromDialog />
      <OperateRecordDialog
        open={operateRecordDialogOpen}
        musicId={operateRecordDialogMusicId}
      />
    </Style>
  );
};

export default Music;
