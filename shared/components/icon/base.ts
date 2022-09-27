import { SVGAttributes } from 'react';
import styled from 'styled-components';

export const Svg = styled.svg.attrs<SVGAttributes<SVGElement>>(() => ({
  viewBox: '0 0 1024 1024',
  version: '1.1',
  xmlns: 'http://www.w3.org/2000/svg',
}))`
  width: 24px;
  height: 24px;

  outline: none;
  color: inherit;
`;

export const Path = styled.path`
  fill: currentColor;
`;
