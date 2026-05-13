import { CSSVariable } from '@/global_style';
import day from '@/utils/day';
import styled from 'styled-components';
import { MdAvTimer, MdDeleteOutline } from 'react-icons/md';
import Button from '@/components/button';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import deleteMusicPlayRecord from '@/server/api/delete_music_play_record';
import { MusicPlayRecord } from '../constants';
import MusicBase from '../../../components/music_base';
import e, { EventType } from '../eventemitter';
import { t } from '@/i18n';

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

const LineAfter = styled.div``;
const Addon = styled.div`
  padding: 5px 0 10px 0;

  border-top: 1px solid ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-family: ${FONT};
  font-weight: 700;

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
  index,
  musicPlayRecord,
}: {
  index: number;
  musicPlayRecord: MusicPlayRecord;
}) {
  return (
    <MusicBase
      active={false}
      index={index}
      music={musicPlayRecord}
      lineAfter={
        <LineAfter>
          <Button
            square
            variant="plain"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              return dialog.confirm({
                title: t('delete_music_play_record_question'),
                onConfirm: () => {
                  const { recordId } = musicPlayRecord;
                  e.emit(EventType.MUSIC_PLAY_RECORD_DELETED, { recordId });
                  void deleteMusicPlayRecord(recordId).catch((error) => {
                    logger.error(error, '删除音乐播放记录失败');
                    dialog.alert({
                      title: t('error'),
                      content: getErrorMessage(error),
                      onConfirm: () =>
                        e.emit(EventType.MUSIC_PLAY_RECORD_DELETE_FAILED, null),
                    });
                  });
                },
              });
            }}
          >
            <MdDeleteOutline />
          </Button>
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
