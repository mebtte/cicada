import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import { type ComponentProps } from 'react';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import { animated } from '@react-spring/web';
import getResizedImage from '@/server/asset/get_resized_image';
import ImageFrame from '@/components/image_frame';
import { CoverFallback } from '@/components/cover';
import { Musicbill } from '../../constants';
import {
  getMusicbillCoverRadius,
  MUSICBILL_COVER_PUBLIC_COLOR,
  MUSICBILL_COVER_PUBLIC_SHADOW,
} from '../../components/musicbill_cover_style';
import { MINI_INFO_HEIGHT } from './constants';
import Operation from './operation';

const COVER_SIZE = 34;
const COVER_RADIUS = getMusicbillCoverRadius(COVER_SIZE);
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;
type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

const Style = styled(animated.div)`
  z-index: 2;
  position: absolute;
  left: 36px;
  right: 36px;
  top: 12px;
  height: ${MINI_INFO_HEIGHT}px;
  padding: 8px 12px 12px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 6px 0 ${NEUTRAL_SHADOW};

  display: flex;
  align-items: center;
  gap: 10px;

  > .name {
    flex: 1;
    min-width: 0;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 900;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .operation-row {
    flex: 0 0 auto;
    min-width: 0;

    > div {
      flex-wrap: nowrap;
    }
  }

  &:focus-within {
    border-color: var(${CSS_VAR.colorPrimaryShadow});
    box-shadow: 0 6px 0 var(${CSS_VAR.colorPrimaryShadow});
  }

  @media (max-width: 680px) {
    left: 24px;
    right: 24px;
  }

  @media (max-width: 420px) {
    left: 18px;
    right: 18px;
    gap: 8px;
    padding-right: 10px;
    padding-left: 10px;
  }
`;
const CoverArt = styled(ImageFrame)`
  flex: 0 0 auto;
`;

function MiniInfo({
  musicbill,
  style,
}: {
  musicbill: Musicbill;
  style?: AnimatedStyle;
}) {
  const borderColor = musicbill.public
    ? MUSICBILL_COVER_PUBLIC_COLOR
    : CSSVariable.COLOR_BORDER;
  const shadowColor = musicbill.public
    ? MUSICBILL_COVER_PUBLIC_SHADOW
    : NEUTRAL_SHADOW;

  return (
    <Style style={style}>
      <CoverArt
        className="cover-card"
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        placeholderSrc={musicbill.coverThumbnail}
        fallbackVariant={CoverFallback.MUSICBILL}
        size={COVER_SIZE}
        radius={COVER_RADIUS}
        borderColor={borderColor}
        shadowColor={shadowColor}
        shadowOffset={3}
      />
      <div className="name">{musicbill.name}</div>
      <div className="operation-row">
        <Operation musicbill={musicbill} />
      </div>
    </Style>
  );
}

export default MiniInfo;
