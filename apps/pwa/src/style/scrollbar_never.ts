import { css } from 'styled-components';

const scrollbarNever = css`
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  scrollbar-width: none;
`;

export default scrollbarNever;
