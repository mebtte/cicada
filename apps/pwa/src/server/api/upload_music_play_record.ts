import { Method, request } from '..';

export interface UploadMusicPlayRecordPayload {
  musicId: string;
  clientRecordId: string;
  percent: number;
  playedAt: number;
}

function uploadMusicPlayRecord(payload: UploadMusicPlayRecordPayload) {
  return request({
    path: '/api/common/music_play_record',
    method: Method.POST,
    body: { ...payload },
    withToken: true,
    requestMinimalDuration: 0,
  });
}

export default uploadMusicPlayRecord;
