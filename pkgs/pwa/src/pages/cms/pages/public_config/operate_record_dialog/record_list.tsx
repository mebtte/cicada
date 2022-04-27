import React from 'react';

import day from '@/utils/day';
import Table from '@/components/table';
import { Record as RecordType } from './constants';

const style = {
  width: '100%',
};
const headers = ['键', '值', '操作用户', '操作时间'];

const RecordList = ({ recordList }: { recordList: RecordType[] }) => {
  const rowRenderer = (record: RecordType) => [
    record.key,
    record.value,
    <span title={`ID:${record.operate_user.id}`}>
      {record.operate_user.nickname}
    </span>,
    day(record.operate_time).format('YYYY-MM-DD HH:mm'),
  ];
  return (
    <Table
      list={recordList}
      headers={headers}
      rowRenderer={rowRenderer}
      stickyHeader
      style={style}
    />
  );
};

export default RecordList;
