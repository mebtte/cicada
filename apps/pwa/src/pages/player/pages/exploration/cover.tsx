import styled from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';

const Style = styled.div<{
  $accent: string;
}>`
  position: relative;
  min-width: 0;
  padding: 8px 8px 10px;

  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 5px 0 rgb(224 224 224);

  cursor: pointer;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out,
    filter 120ms ease-out;

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: 12px;
    right: 12px;
    height: 4px;

    border-radius: 0 0 4px 4px;
    background: ${({ $accent }) => $accent};
  }

  > .artwork {
    border-radius: 7px;
  }

  > .info {
    margin-top: 8px;
    padding: 0 2px;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgb(216 216 216);
    box-shadow: 0 7px 0 rgb(224 224 224);
    filter: brightness(1.01);
  }

  &:active {
    transform: translateY(5px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }
`;

function Wrapper({
  src,
  info,
  accent = 'rgb(88 204 2)',
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  src: string;
  info: ReactNode;
  accent?: string;
}) {
  return (
    <Style $accent={accent} {...props}>
      <Cover className="artwork" size="100%" src={src} />
      <div className="info">{info}</div>
    </Style>
  );
}

export default Wrapper;
