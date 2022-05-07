import { css } from 'styled-components';

const THUMB_COLOR = 'rgb(0 0 0 / 0.1)';

const scrollbarAlways = css`
  /* webkit */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background-color: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${THUMB_COLOR};
  }

  /* firefox */
  scrollbar-width: thin;
  scrollbar-color: ${THUMB_COLOR} transparent;
`;

export default scrollbarAlways;
