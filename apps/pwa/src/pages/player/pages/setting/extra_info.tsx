import { BETA_VERSION_START } from '#/constants';
import definition from '@/definition';
import { useServer } from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';

const Style = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-align: center;

  > a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      text-decoration: underline;
    }
  }
`;

function ExtraInfo() {
  const selectedServer = useServer()!;

  return (
    <Style>
      PWA Version:&nbsp;
      <a
        href={
          definition.VERSION.startsWith(BETA_VERSION_START)
            ? 'https://github.com/mebtte/cicada/tree/beta'
            : `https://github.com/mebtte/cicada/releases/tag/${definition.VERSION}`
        }
        target="_blank"
        rel="noreferrer"
      >
        {definition.VERSION}
      </a>
      {selectedServer.version ? (
        <>
          , Server Version:&nbsp;
          <a
            href={
              selectedServer.version.startsWith(BETA_VERSION_START)
                ? 'https://github.com/mebtte/cicada/tree/beta'
                : `https://github.com/mebtte/cicada/releases/tag/${definition.VERSION}`
            }
            target="_blank"
            rel="noreferrer"
          >
            {selectedServer.version}
          </a>
        </>
      ) : null}
    </Style>
  );
}

export default ExtraInfo;
