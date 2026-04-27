import styled from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import Cover from '@/components/cover';

const Style = styled.div`
  min-width: 0;

  cursor: pointer;

  > .info {
    margin-top: 3px;
  }
`;

function Wrapper({
  src,
  info,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  src: string;
  info: ReactNode;
}) {
  return (
    <Style {...props}>
      <Cover size="100%" src={src} />
      <div className="info">{info}</div>
    </Style>
  );
}

export default Wrapper;
