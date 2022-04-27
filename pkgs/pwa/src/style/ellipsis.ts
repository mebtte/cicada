import { css } from 'styled-components';

const ellipsis = css`
  overflow: hidden;
  white-space: nowrap;
  min-width: 0;
  text-overflow: ellipsis;
`;

export default ellipsis;
