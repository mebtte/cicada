import { CSSVariable } from '@/global_style';
import day from '#/utils/day';
import styled from 'styled-components';
import { MdAvTimer, MdDeleteOutline } from 'react-icons/md';
import IconButton from '@/components/icon_button';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import deleteMusicPlayRecord from '@/server/api/delete_music_play_record';
import { MusicPlayRecord } from '../constants';
import MusicBase from '../../../components/music_base';
import e, { EventType } from '../eventemitter';

const LineAfter = styled.div``;
const Addon = styled.div`
  padding: 5px 0 10px 0;

  border-top: 1px solid ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  font-family: monospace;

  display: flex;
  align-items: center;
  gap: 5px;

  > .divider {
    &::after {
      content: '|';
    }
  }
`;

function MusicWithExternalInfo({
  musicPlayRecord,
}: {
  musicPlayRecord: MusicPlayRecord;
}) {
  return (
    <MusicBase
      active={false}
      index={musicPlayRecord.index}
      music={musicPlayRecord}
      lineAfter={
        <LineAfter>
          <IconButton
            size={28}
            onClick={(event) => {
              event.stopPropagation();
              return dialog.confirm({
                title: '确定删除该条播放记录吗?',
                onConfirm: async () => {
                  try {
                    await deleteMusicPlayRecord(musicPlayRecord.recordId);
                    e.emit(EventType.MUSIC_PLAY_RECORD_DELETED, null);
                  } catch (error) {
                    logger.error(error, '删除音乐播放记录失败');
                    notice.error(error.message);
                  }
                },
              });
            }}
          >
            <MdDeleteOutline />
          </IconButton>
        </LineAfter>
      }
      addon={
        <Addon>
          <div>{day(musicPlayRecord.timestamp).format('YYYY-MM-DD HH:mm')}</div>
          <div className="divider" />
          <MdAvTimer />
          <div>{Number((musicPlayRecord.percent * 100).toFixed(2))}%</div>
        </Addon>
      }
    />
  );
}

export default MusicWithExternalInfo;
