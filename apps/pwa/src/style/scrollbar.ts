import { css } from 'styled-components';

const scrollbar = css`
  --scrollbar-color: rgb(240 240 240);

  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-color) transparent;

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }
  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-color);
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
`;

export default scrollbar;
