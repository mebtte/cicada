import {
  BETA_VERSION_BRANCH,
  BETA_VERSION_IDENTIFIER,
} from '@/constants/version';
import definition from '@/definition';
import { useSelectedServer } from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';

const Style = styled.div`
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-align: center;

  > .item {
    margin: 3px 0;
    > a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: ${CSSVariable.COLOR_PRIMARY};
        text-decoration: underline;
      }
    }
  }
`;

function getVersionLink(version: string) {
  if (version.includes(BETA_VERSION_IDENTIFIER)) {
    return `https://github.com/mebtte/cicada/tree/${BETA_VERSION_BRANCH}`;
  }

  return `https://github.com/mebtte/cicada/releases/tag/${version}`;
}

function ExtraInfo() {
  const selectedServer = useSelectedServer()!;

  return (
    <Style>
      <div className="item">
        PWA Version:&nbsp;
        <a href={getVersionLink(definition.VERSION)} target="_blank" rel="noreferrer">
          {definition.VERSION}
        </a>
      </div>
      <div className="item">Server Name: {selectedServer.hostname}</div>
      <div className="item">
        Server Version:&nbsp;
        <a href={getVersionLink(selectedServer.version)} target="_blank" rel="noreferrer">
          {selectedServer.version}
        </a>
      </div>
      <div className="item">Server Address: {selectedServer.origin}</div>
    </Style>
  );
}

export default ExtraInfo;
