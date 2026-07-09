import { HTMLAttributes } from 'react';
import styled from 'styled-components';
import classnames from 'classnames';
import Cover from '@/components/cover';
import absoluteFullSize from '@/style/absolute_full_size';
import { CSSVariable } from '@/global_style';

const Style = styled.div`
  font-size: 0;
  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};

  &.publiz {
    outline: 2px solid #63d1fa;
  }

  &.shared {
    position: relative;

    &::after {
      content: '';

      border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
      box-shadow: inset 0 0 0 2px #eabec8;

      ${absoluteFullSize}
    }
  }
`;

const preventDefault = (event) => event.preventDefault();

function MusicbillCover({
  publiz,
  shared,
  size,
  src,
  placeholderSrc,
  ...props
}: {
  publiz: boolean;
  shared: boolean;
  size: number;
  src: string;
  placeholderSrc?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Style
      {...props}
      className={classnames(props.className, { publiz, shared })}
    >
      <Cover
        src={src}
        placeholderSrc={placeholderSrc}
        size={size}
        onDragStart={preventDefault}
      />
    </Style>
  );
}

export default MusicbillCover;
