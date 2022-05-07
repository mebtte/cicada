import styled from 'styled-components';

import env from '@/env';
import { CICADA_START_YEAR } from '@/constants';

const Style = styled.div`
  flex: 1;
  font-size: 12px;
  color: #555;
  line-height: 2;
  text-align: center;
  a {
    text-decoration: none;
    color: inherit;
    &:hover {
      color: #fff;
    }
  }
`;

function Copyright() {
  return (
    <Style>
      <div className="version">知了&nbsp;@&nbsp;{env.VERSION}</div>
      <div className="copyright">
        <a href="https://mebtte.com">MEBTTE</a>
        &nbsp;&copy;&nbsp;
        {CICADA_START_YEAR}
        &nbsp;~&nbsp;
        {new Date().getFullYear()}
      </div>
    </Style>
  );
}

export default Copyright;
