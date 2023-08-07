import { css } from 'styled-components';
import scollbar from './scrollbar';

const autoScrollbar = css`
  ${({ theme }) => (theme.autoScrollbar ? null : scollbar)}
`;

export default autoScrollbar;
