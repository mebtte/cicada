import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import getResizedImage from '@/server/asset/get_resized_image';
import MusicbillCover from '../../components/musicbill_cover';
import { Musicbill } from '../../constants';
import { MINI_INFO_HEIGHT } from './constants';
import Operation from './operation';

const COVER_SIZE = 32;
const Style = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${MINI_INFO_HEIGHT}px;
  padding: 0 20px;

  backdrop-filter: blur(5px);

  display: flex;
  align-items: center;
  gap: 10px;

  > .name {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    font-weight: bold;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }
`;

function MiniInfo({ musicbill }: { musicbill: Musicbill }) {
  return (
    <Style>
      <MusicbillCover
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        size={COVER_SIZE}
        publiz={musicbill.public}
        shared={musicbill.sharedUserList.length > 0}
      />
      <div className="name">{musicbill.name}</div>
      <Operation musicbill={musicbill} />
    </Style>
  );
}

export default MiniInfo;
