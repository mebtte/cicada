import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';
import Cover from '@/components/cover';
import classnames from 'classnames';
import absoluteFullSize from '@/style/absolute_full_size';

const Style = styled.div`
  font-size: 0;

  &.publiz {
    outline: 2px solid #63d1fa;
  }

  &.shared {
    position: relative;

    &::after {
      content: '';

      box-shadow: inset 0 0 0 2px #eabec8;

      ${absoluteFullSize}
    }
  }
`;
const preventDefault = (event) => event.preventDefault();

function MusicbillCover({
  src,
  size,
  publiz,
  shared,
  ...props
}: {
  src: string;
  size: string | number;
  publiz: boolean;
  shared: boolean;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <Style
      {...props}
      className={classnames(props.className, { publiz, shared })}
    >
      <Cover src={src} size={size} onDragStart={preventDefault} />
    </Style>
  );
}

export default MusicbillCover;
