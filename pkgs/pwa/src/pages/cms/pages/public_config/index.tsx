import React from 'react';
import styled from 'styled-components';

import { PublicConfigKey } from '@/constants/public_config';
import useQuery from '@/utils/use_query';
import { cmsPage } from '../../style';
import { Query } from './constants';
import UpdateDialog from './update_dialog';
import Action from './action';
import OperateRecordDialog from './operate_record_dialog';
import PublicConfigList from './public_config_list';

const Style = styled.div`
  ${cmsPage};
  display: flex;
`;

const PublicConfig = () => {
  const query = useQuery<Query>();
  const operateRecordDialogOpen = !!query[Query.OPERATE_RECORD_DIALOG_OPEN];
  const operateRecordDialogKey = query[
    Query.OPERATE_RECORD_DIALOG_KEY
  ] as PublicConfigKey;

  return (
    <Style>
      <Action />
      <PublicConfigList />

      <UpdateDialog />
      <OperateRecordDialog
        open={operateRecordDialogOpen}
        key={operateRecordDialogKey}
      />
    </Style>
  );
};

export default PublicConfig;
