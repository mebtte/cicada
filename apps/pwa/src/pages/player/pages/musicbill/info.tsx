import styled from 'styled-components';
import day from '@/utils/day';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { Musicbill } from '../../constants';
import { INFO_HEIGHT } from './constants';
import Operation from './operation';
import MusicbillCover from '../../components/musicbill_cover';

const COVER_SIZE = 96;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const Style = styled.div`
  height: ${INFO_HEIGHT}px;
  width: 100%;
  margin: 0 0 14px;
  padding: 16px 18px 18px;

  display: flex;
  align-items: center;
  gap: 16px;

  position: relative;
  overflow: hidden;
  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 18px;
  box-shadow: 0 6px 0 rgb(232 232 232);

  > .cover-card {
    flex: 0 0 auto;
    border-radius: 16px;
    box-shadow: 0 6px 0 rgb(232 232 232);

    > div {
      border-radius: 14px;
    }

    &.shared::after {
      border-radius: 16px;
    }
  }

  > .info {
    flex: 1;
    min-width: 0;

    display: flex;
    flex-direction: column;
    gap: 8px;

    > .name {
      display: -webkit-box;
      overflow: hidden;

      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0;
      line-height: 1.2;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    > .create-time {
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
      font-weight: 700;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      ${upperCaseFirstLetter}

      > .public-state {
        color: ${PRIMARY};
        font-weight: 900;
      }
    }

    > .operation-row {
      min-width: 0;
    }
  }

  @media (max-width: 680px) {
    min-height: ${INFO_HEIGHT}px;
    height: auto;
    padding: 14px 12px 16px;
    gap: 12px;

    > .info {
      gap: 8px;

      > .name {
        font-size: 20px;
      }
    }
  }

  @media (max-width: 420px) {
    align-items: flex-start;

    > .cover-card {
      width: 96px;

      > div {
        width: 96px !important;
      }
    }

    > .info {
      > .meta {
        gap: 6px;
      }

      > .name {
        font-size: 18px;
      }
    }
  }
`;

function Info({ musicbill }: { musicbill: Musicbill }) {
  const sharedUserCount = musicbill.sharedUserList.length;

  return (
    <Style>
      <MusicbillCover
        className="cover-card"
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        size={COVER_SIZE}
        publiz={false}
        shared={false}
      />
      <div className="info">
        <div className="name">{musicbill.name}</div>
        <div className="create-time">
          {musicbill.public ? (
            <>
              <span className="public-state">{t('public')}</span>
              &nbsp;·&nbsp;
            </>
          ) : null}
          {t('create_at')}
          &nbsp;
          {day(musicbill.createTimestamp).format('YYYY-MM-DD HH:mm')}
        </div>
        <div className="operation-row">
          <Operation musicbill={musicbill} />
        </div>
      </div>
    </Style>
  );
}

export default Info;
