import getSingerModifyRecordList from '@/server/api/get_singer_modify_record_list';

export interface Singer {
  id: string;
  avatar: string;
  name: string;
}

export type ModifyRecord = AsyncReturnType<typeof getSingerModifyRecordList>[0];
