import styled from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import Cover from '@/components/cover';

const Style = styled.div`
  display: inline-block;
  padding: 0 10px;
  margin: 7px 0;

  cursor: pointer;
  vertical-align: top;

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
