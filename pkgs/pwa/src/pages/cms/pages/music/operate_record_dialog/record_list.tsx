import React from 'react';

import IconButton, { Name } from '@/components/icon_button';
import day from '@/utils/day';
import Table from '@/components/table';
import { Record as RecordType } from './constants';
import CMSEventemitter, {
  EventType as CMSEventType,
} from '../../../eventemitter';

const RECORD_TYPE_MAP_LABEL = {
  create: '创建',
  modify: '更改',
};
const style = {
  width: '100%',
};
const headers = ['音乐 ID', '操作用户', '类型', '操作时间', '详情'];

const RecordList = ({ recordList }: { recordList: RecordType[] }) => {
  const rowRenderer = (record: RecordType) => [
    record.music_id,
    <span title={record.operate_user.id}>{record.operate_user.nickname}</span>,
    RECORD_TYPE_MAP_LABEL[record.type] || '未知类型',
    day(record.operate_time).format('YYYY-MM-DD HH:mm'),
    <IconButton
      name={Name.VIEW_OUTLINE}
      size={22}
      onClick={() =>
        CMSEventemitter.emit(CMSEventType.VIEW_JSON, {
          json: {
            ...record,
            content: JSON.parse(record.content),
          },
        })
      }
    />,
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
