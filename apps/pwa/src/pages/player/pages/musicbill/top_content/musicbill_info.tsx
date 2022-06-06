import { animated } from 'react-spring';
import styled, { css } from 'styled-components';
import day from '#/utils/day';
import { RequestStatus } from '@/constants';
import Avatar from '@/components/avatar';
import { Musicbill } from '../../../constants';

const Style = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  box-sizing: border-box;

  > .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    > .name {
      font-size: 16px;
      font-weight: bold;
      color: var(--text-color-primary);
    }
  }
`;
const Cover = styled(Avatar)<{ publiz: boolean }>`
  ${({ publiz }) => css`
    border: ${publiz ? '3px solid var(--color-primary)' : 'none'};
  `}
`;

function MusicbillInfo({
  musicbill,
  style,
}: {
  musicbill: Musicbill;
  style: unknown;
}) {
  return (
    // @ts-expect-error
    <Style style={style}>
      <Cover
        animated
        src={musicbill.cover}
        size={70}
        publiz={musicbill.public}
      />
      <div className="info">
        <div className="name">{musicbill.name}</div>
        <div className="description">
          创建于 {day(musicbill.createTimestamp).format('YYYY-MM-DD HH:mm')}
          {musicbill.status === RequestStatus.SUCCESS ? (
            <span>, 共 {musicbill.musicList.length} 首音乐</span>
          ) : null}
        </div>
      </div>
    </Style>
  );
}

export default MusicbillInfo;
