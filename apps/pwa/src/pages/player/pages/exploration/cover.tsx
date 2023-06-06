import styled from 'styled-components';
import Cover from '@/components/cover';
import { HtmlHTMLAttributes, ReactNode } from 'react';

const Style = styled.div`
  position: relative;

  display: inline-block;

  cursor: pointer;
  overflow: hidden;

  > .info {
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;

    padding: 10px;

    translate: -100%;
    transition: 300ms;
    background-color: rgb(255 255 255 / 0.75);
    backdrop-filter: blur(5px);
  }

  &:hover {
    > .info {
      translate: 0%;
    }
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
      <Cover src={src} size="100%" />
      <div className="info">{info}</div>
    </Style>
  );
}

export default Wrapper;
