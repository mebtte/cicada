import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import { type ComponentProps } from 'react';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import { animated } from 'react-spring';
import getResizedImage from '@/server/asset/get_resized_image';
import Cover from '@/components/cover';
import { FLOATING_CONTROLLER_SCROLL_SPACE, Musicbill } from '../../constants';
import { MINI_INFO_HEIGHT } from './constants';
import Operation from './operation';

const COVER_SIZE = 34;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PUBLIC = '#63d1fa';
const PUBLIC_SHADOW = 'rgb(72 179 220)';
const NEUTRAL_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

const Style = styled(animated.div)`
  z-index: 2;
  position: absolute;
  left: 36px;
  right: 36px;
  bottom: calc(${FLOATING_CONTROLLER_SCROLL_SPACE} + 12px);
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
    border-color: ${PRIMARY};
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
const CoverArt = styled(Cover)<{ $public: boolean }>`
  flex: 0 0 auto;
  box-sizing: border-box;
  overflow: hidden;

  background: #fff;
  border: 2px solid
    ${({ $public }) => ($public ? PUBLIC : CSSVariable.COLOR_BORDER)};
  border-radius: 10px;
  box-shadow: 0 3px 0
    ${({ $public }) => ($public ? PUBLIC_SHADOW : NEUTRAL_SHADOW)};
`;

function MiniInfo({
  musicbill,
  style,
}: {
  musicbill: Musicbill;
  style?: AnimatedStyle;
}) {
  return (
    <Style style={style}>
      <CoverArt
        className="cover-card"
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        size={COVER_SIZE}
        $public={musicbill.public}
      />
      <div className="name">{musicbill.name}</div>
      <div className="operation-row">
        <Operation musicbill={musicbill} />
      </div>
    </Style>
  );
}

export default MiniInfo;
