import getArtistModifyRecordList from '@/server/api/get_artist_modify_record_list';

export interface Singer {
  id: string;
  avatar: string;
  name: string;
}

export type Artist = Singer;

export type ModifyRecord = AsyncReturnType<typeof getArtistModifyRecordList>[0];
