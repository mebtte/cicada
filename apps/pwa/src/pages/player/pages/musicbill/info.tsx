import styled from 'styled-components';
import day from '@/utils/day';
import { CSSVariable } from '@/global_style';
import getResizedImage from '@/server/asset/get_resized_image';
import ImageFrame from '@/components/image_frame';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { Musicbill } from '../../constants';
import {
  getMusicbillCoverRadius,
  MUSICBILL_COVER_PUBLIC_COLOR,
  MUSICBILL_COVER_PUBLIC_SHADOW,
} from '../../components/musicbill_cover_style';
import { INFO_HEIGHT } from './constants';
import Operation from './operation';

const COVER_SIZE = 96;
const COVER_RADIUS = getMusicbillCoverRadius(COVER_SIZE);
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;
const Style = styled.div`
  height: ${INFO_HEIGHT}px;
  width: 100%;
  margin: 0 0 14px;
  padding: 10px 18px 12px;

  display: flex;
  align-items: center;
  gap: 16px;

  position: relative;
  overflow: hidden;
  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 18px;
  box-shadow: 0 6px 0 ${NEUTRAL_SHADOW};

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
    }

    > .operation-row {
      min-width: 0;
    }
  }

  @media (max-width: 680px) {
    min-height: ${INFO_HEIGHT}px;
    height: auto;
    padding: 8px 12px 10px;
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
const CoverArt = styled(ImageFrame)`
  flex: 0 0 auto;
`;

function Info({ musicbill }: { musicbill: Musicbill }) {
  const borderColor = musicbill.public
    ? MUSICBILL_COVER_PUBLIC_COLOR
    : CSSVariable.COLOR_BORDER;
  const shadowColor = musicbill.public
    ? MUSICBILL_COVER_PUBLIC_SHADOW
    : NEUTRAL_SHADOW;

  return (
    <Style>
      <CoverArt
        className="cover-card"
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        placeholderSrc={musicbill.coverThumbnail}
        size={COVER_SIZE}
        radius={COVER_RADIUS}
        borderColor={borderColor}
        shadowColor={shadowColor}
        shadowOffset={6}
      />
      <div className="info">
        <div className="name">{musicbill.name}</div>
        <div className="create-time">
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
