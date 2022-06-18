import styled, { css } from 'styled-components';
import Avatar from '@/components/avatar';
import { COVER_SIZE } from './constants';

const Style = styled.div<{ publiz: boolean }>`
  font-size: 0;
  > .cover {
    cursor: pointer;
  }
  ${({ publiz }) => css`
    > .cover {
      border: ${publiz ? '2px solid var(--color-primary)' : 'none'};
    }
  `}
`;

function Cover({ src, publiz }: { src: string; publiz: boolean }) {
  return (
    <Style publiz={publiz}>
      <Avatar className="cover" src={src} size={COVER_SIZE} animated />
    </Style>
  );
}

export default Cover;
