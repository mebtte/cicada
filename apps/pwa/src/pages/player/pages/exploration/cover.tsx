import styled from 'styled-components';
import Cover from '@/components/cover';
import { HtmlHTMLAttributes } from 'react';

const Style = styled.div`
  position: relative;

  display: inline-block;
`;

function Wrapper({
  src,
  children,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  src: string;
}) {
  return (
    <Style {...props}>
      <Cover src={src} size="100%" />
      {children}
    </Style>
  );
}

export default Wrapper;
