import styled from 'styled-components';

const WIDTH = 320;

export default styled.div`
  position: absolute;
  left: calc(50% - ${WIDTH / 2}px);
  top: 50%;
  width: ${WIDTH}px;

  padding: 30px 20px;

  transform: translateY(-50%);
  -webkit-app-region: no-drag;
`;
