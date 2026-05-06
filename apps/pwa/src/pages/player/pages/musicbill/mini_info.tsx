import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import getResizedImage from '@/server/asset/get_resized_image';
import MusicbillCover from '../../components/musicbill_cover';
import { Musicbill } from '../../constants';
import { MINI_INFO_HEIGHT } from './constants';
import Operation from './operation';

const COVER_SIZE = 34;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const Style = styled.div`
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${MINI_INFO_HEIGHT}px;
  padding: 8px 20px 12px;

  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 4px 0 rgb(232 232 232);

  display: flex;
  align-items: center;
  gap: 10px;

  > .cover-card {
    flex: 0 0 auto;
    border-radius: 10px;
    box-shadow: 0 3px 0 rgb(232 232 232);

    > div {
      border-radius: 9px;
    }

    &.shared::after {
      border-radius: 10px;
    }
  }

  > .name {
    flex: 1;
    min-width: 0;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 900;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  &:focus-within {
    border-color: ${PRIMARY};
    box-shadow: 0 4px 0 var(${CSS_VAR.colorPrimaryShadow});
  }

  @media (max-width: 680px) {
    padding: 8px 12px 12px;
  }
`;

function MiniInfo({ musicbill }: { musicbill: Musicbill }) {
  return (
    <Style>
      <MusicbillCover
        className="cover-card"
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        size={COVER_SIZE}
        publiz={false}
        shared={false}
      />
      <div className="name">{musicbill.name}</div>
      <Operation musicbill={musicbill} />
    </Style>
  );
}

export default MiniInfo;
