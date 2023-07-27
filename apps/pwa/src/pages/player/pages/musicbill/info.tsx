import styled from 'styled-components';
import day from '#/utils/day';
import { CSSVariable } from '@/global_style';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { Musicbill } from '../../constants';
import { INFO_HEIGHT } from './constants';
import Operation from './operation';
import MusicbillCover from '../../components/musicbill_cover';

const GAP = 10;
const COVER_SIZE = INFO_HEIGHT - GAP * 2;
const Style = styled.div`
  height: ${INFO_HEIGHT}px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  > .info {
    flex: 1;
    min-width: 0;
    height: ${INFO_HEIGHT - GAP * 2}px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    > .name {
      font-size: 14px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }

    > .create-time {
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      ${upperCaseFirstLetter}
    }
  }
`;

function Info({ musicbill }: { musicbill: Musicbill }) {
  return (
    <Style>
      <MusicbillCover
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        size={COVER_SIZE}
        publiz={musicbill.public}
        shared={musicbill.sharedUserList.length > 0}
      />
      <div className="info">
        <div className="name">{musicbill.name}</div>
        <div className="create-time">
          {t('create_at')}{' '}
          {day(musicbill.createTimestamp).format('YYYY-MM-DD HH:mm')}
        </div>
        <Operation musicbill={musicbill} />
      </div>
    </Style>
  );
}

export default Info;
